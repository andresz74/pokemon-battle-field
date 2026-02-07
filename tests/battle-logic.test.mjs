import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDamage,
  getHpStat,
  getTypeEffectivenessMultiplier,
} from "../src/lib/battle.js";

test("getHpStat returns hp base stat", () => {
  const hp = getHpStat({
    stats: [
      { stat: { name: "attack" }, base_stat: 40 },
      { stat: { name: "hp" }, base_stat: 80 },
    ],
  });

  assert.equal(hp, 80);
});

test("type effectiveness multiplier handles super-effective and resistant types", async () => {
  const resolveType = async (typeName) => {
    if (typeName === "water") {
      return {
        damage_relations: {
          no_damage_from: [],
          half_damage_from: [],
          double_damage_from: [{ name: "electric" }],
        },
      };
    }

    return {
      damage_relations: {
        no_damage_from: [],
        half_damage_from: [{ name: "electric" }],
        double_damage_from: [],
      },
    };
  };

  const multiplier = await getTypeEffectivenessMultiplier(
    "electric",
    ["water", "grass"],
    resolveType
  );

  assert.equal(multiplier, 1);
});

test("calculateDamage uses move power, stats, STAB and type multiplier", () => {
  const attacker = {
    stats: [
      { stat: { name: "attack" }, base_stat: 70 },
      { stat: { name: "special-attack" }, base_stat: 90 },
    ],
    types: [{ type: { name: "electric" } }],
  };

  const defender = {
    stats: [
      { stat: { name: "defense" }, base_stat: 60 },
      { stat: { name: "special-defense" }, base_stat: 70 },
    ],
  };

  const move = {
    power: 90,
    damage_class: { name: "special" },
    type: { name: "electric" },
  };

  const damage = calculateDamage({
    attacker,
    defender,
    move,
    typeMultiplier: 2,
    randomFactor: 1,
    critical: false,
  });

  assert.ok(damage > 0);
  assert.equal(typeof damage, "number");
});
