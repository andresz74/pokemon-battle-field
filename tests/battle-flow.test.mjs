import test from "node:test";
import assert from "node:assert/strict";
import { applyTurn, isReadyToStartBattle } from "../src/lib/battle.js";

const makePokemon = (name, types, stats) => ({
  name,
  types: types.map((typeName) => ({ type: { name: typeName } })),
  stats: [
    { stat: { name: "hp" }, base_stat: stats.hp },
    { stat: { name: "attack" }, base_stat: stats.attack },
    { stat: { name: "defense" }, base_stat: stats.defense },
    { stat: { name: "special-attack" }, base_stat: stats.spAttack },
    { stat: { name: "special-defense" }, base_stat: stats.spDefense },
    { stat: { name: "speed" }, base_stat: stats.speed },
  ],
});

const thunderboltSelection = { move: { url: "https://pokeapi.co/api/v2/move/85/" } };
const quickAttackSelection = { move: { url: "https://pokeapi.co/api/v2/move/98/" } };

test("battle starts only when both pokemon are selected", () => {
  assert.equal(isReadyToStartBattle({ name: "pikachu" }, { name: "eevee" }), true);
  assert.equal(isReadyToStartBattle({ name: "pikachu" }, null), false);
  assert.equal(isReadyToStartBattle(null, { name: "eevee" }), false);
});

test("priority decides first attacker", async () => {
  const resolveMove = async (url) => {
    if (url.includes("85")) {
      return {
        name: "thunderbolt",
        accuracy: 100,
        power: 90,
        priority: 0,
        damage_class: { name: "special" },
        type: { name: "electric" },
      };
    }

    return {
      name: "quick-attack",
      accuracy: 100,
      power: 40,
      priority: 1,
      damage_class: { name: "physical" },
      type: { name: "normal" },
    };
  };

  const resolveType = async () => ({
    damage_relations: {
      no_damage_from: [],
      half_damage_from: [],
      double_damage_from: [],
    },
  });

  const result = await applyTurn({
    currentTurn: "pokemon1",
    player1Pokemon: makePokemon("pikachu", ["electric"], {
      hp: 35,
      attack: 55,
      defense: 40,
      spAttack: 90,
      spDefense: 50,
      speed: 90,
    }),
    player2Pokemon: makePokemon("squirtle", ["water"], {
      hp: 44,
      attack: 48,
      defense: 65,
      spAttack: 50,
      spDefense: 64,
      speed: 43,
    }),
    player1Hp: 120,
    player2Hp: 120,
    selectedMove1: thunderboltSelection,
    selectedMove2: quickAttackSelection,
    resolveMove,
    resolveType,
    random: () => 0,
  });

  assert.equal(result.applied, true);
  assert.equal(result.currentTurn, "pokemon2");
  assert.ok(result.player1Hp < 120);
  assert.ok(result.player2Hp < 120);
  assert.match(result.message, /quick-attack/);
});

test("both players must select a move", async () => {
  const result = await applyTurn({
    currentTurn: "pokemon1",
    player1Pokemon: makePokemon("pikachu", ["electric"], {
      hp: 35,
      attack: 55,
      defense: 40,
      spAttack: 90,
      spDefense: 50,
      speed: 90,
    }),
    player2Pokemon: makePokemon("squirtle", ["water"], {
      hp: 44,
      attack: 48,
      defense: 65,
      spAttack: 50,
      spDefense: 64,
      speed: 43,
    }),
    player1Hp: 35,
    player2Hp: 44,
    selectedMove1: thunderboltSelection,
    selectedMove2: null,
    resolveMove: async () => ({
      name: "thunder",
      accuracy: 50,
      power: 110,
      priority: 0,
      damage_class: { name: "special" },
      type: { name: "electric" },
    }),
    resolveType: async () => ({
      damage_relations: {
        no_damage_from: [],
        half_damage_from: [],
        double_damage_from: [],
      },
    }),
    random: () => 0.99,
  });

  assert.equal(result.applied, false);
  assert.match(result.message, /must select a move/i);
});
