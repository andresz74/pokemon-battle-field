const DEFAULT_LEVEL = 30;
const RANDOM_MIN = 0.92;
const RANDOM_MAX = 1;
const CRIT_CHANCE = 0.04;
const CRIT_MULTIPLIER = 1.25;

function getStatValue(pokemon, statName, fallback = 1) {
  const stat = pokemon?.stats?.find((entry) => entry?.stat?.name === statName);
  const value = stat?.base_stat;

  if (typeof value !== "number" || value <= 0) {
    return fallback;
  }

  return value;
}

function formatMultiplier(multiplier) {
  if (multiplier === 0) {
    return "0x";
  }

  if (Number.isInteger(multiplier)) {
    return `${multiplier}x`;
  }

  return `${multiplier.toFixed(2)}x`;
}

function getMovePriority(move) {
  return typeof move?.priority === "number" ? move.priority : 0;
}

function chooseFirstAttacker({
  move1,
  move2,
  player1Pokemon,
  player2Pokemon,
  currentTurn,
  random,
}) {
  const p1Priority = getMovePriority(move1);
  const p2Priority = getMovePriority(move2);

  if (p1Priority !== p2Priority) {
    return p1Priority > p2Priority ? "pokemon1" : "pokemon2";
  }

  const p1Speed = getStatValue(player1Pokemon, "speed", 0);
  const p2Speed = getStatValue(player2Pokemon, "speed", 0);
  const p1Initiative = p1Speed + random() * 15;
  const p2Initiative = p2Speed + random() * 15;

  if (p1Initiative !== p2Initiative) {
    return p1Initiative > p2Initiative ? "pokemon1" : "pokemon2";
  }

  if (currentTurn === "pokemon1" || currentTurn === "pokemon2") {
    return currentTurn;
  }

  return random() < 0.5 ? "pokemon1" : "pokemon2";
}

export function getHpStat(pokemon) {
  const hpStat = pokemon?.stats?.find((stat) => stat?.stat?.name === "hp");
  return hpStat?.base_stat ?? null;
}

export function isReadyToStartBattle(player1Pokemon, player2Pokemon) {
  return Boolean(player1Pokemon && player2Pokemon);
}

export async function getTypeEffectivenessMultiplier(
  attackingType,
  defenderTypeNames,
  resolveType
) {
  if (!attackingType || !defenderTypeNames?.length) {
    return 1;
  }

  let multiplier = 1;

  for (const defenderTypeName of defenderTypeNames) {
    const defenderType = await resolveType(defenderTypeName);
    const relations = defenderType?.damage_relations;
    if (!relations) {
      continue;
    }

    if (relations.no_damage_from?.some((t) => t.name === attackingType)) {
      return 0;
    }

    if (relations.double_damage_from?.some((t) => t.name === attackingType)) {
      multiplier *= 2;
    }

    if (relations.half_damage_from?.some((t) => t.name === attackingType)) {
      multiplier *= 0.5;
    }
  }

  return multiplier;
}

export function calculateDamage({
  attacker,
  defender,
  move,
  typeMultiplier,
  randomFactor,
  critical,
  level = DEFAULT_LEVEL,
}) {
  const movePower = move?.power;
  if (!movePower || movePower <= 0) {
    return 0;
  }

  const damageClass = move?.damage_class?.name;
  if (damageClass !== "physical" && damageClass !== "special") {
    return 0;
  }

  const attackStatName = damageClass === "physical" ? "attack" : "special-attack";
  const defenseStatName = damageClass === "physical" ? "defense" : "special-defense";

  const attack = getStatValue(attacker, attackStatName);
  const defense = getStatValue(defender, defenseStatName);

  const stab = attacker?.types?.some((t) => t?.type?.name === move?.type?.name)
    ? 1.5
    : 1;

  const critMultiplier = critical ? CRIT_MULTIPLIER : 1;
  const variance =
    typeof randomFactor === "number" && randomFactor > 0 ? randomFactor : 1;

  const baseDamage = Math.floor(
    ((2 * level) / 5 + 2) * movePower * (attack / defense) / 50 + 2
  );

  const modifier = stab * typeMultiplier * critMultiplier * variance;
  const totalDamage = Math.floor(baseDamage * modifier);

  if (typeMultiplier === 0) {
    return 0;
  }

  return Math.max(1, totalDamage);
}

async function resolveSingleAttack({
  attackerPokemon,
  defenderPokemon,
  defenderHp,
  moveData,
  resolveType,
  random,
}) {
  const accuracy = moveData.accuracy ?? 100;
  const hitRoll = random() * 100;
  if (hitRoll > accuracy) {
    return {
      damage: 0,
      nextDefenderHp: defenderHp,
      message: `${attackerPokemon.name} used ${moveData.name}, but it missed.`,
    };
  }

  const defenderTypes = (defenderPokemon?.types ?? []).map((t) => t?.type?.name);
  const typeMultiplier = await getTypeEffectivenessMultiplier(
    moveData?.type?.name,
    defenderTypes,
    resolveType
  );

  const randomFactor = RANDOM_MIN + random() * (RANDOM_MAX - RANDOM_MIN);
  const critical = random() < CRIT_CHANCE;

  const damage = calculateDamage({
    attacker: attackerPokemon,
    defender: defenderPokemon,
    move: moveData,
    typeMultiplier,
    randomFactor,
    critical,
  });

  const nextDefenderHp = Math.max(0, defenderHp - damage);

  let effectivenessSuffix = "";
  if (typeMultiplier >= 2) {
    effectivenessSuffix = " It is super effective.";
  } else if (typeMultiplier > 0 && typeMultiplier < 1) {
    effectivenessSuffix = " It is not very effective.";
  } else if (typeMultiplier === 0) {
    effectivenessSuffix = " It has no effect.";
  }

  const critSuffix = critical ? " Critical hit!" : "";

  return {
    damage,
    nextDefenderHp,
    message: `${attackerPokemon.name} used ${moveData.name} and dealt ${damage} damage (${formatMultiplier(
      typeMultiplier
    )}).${effectivenessSuffix}${critSuffix}`,
  };
}

export async function applyTurn({
  currentTurn,
  player1Pokemon,
  player2Pokemon,
  player1Hp,
  player2Hp,
  selectedMove1,
  selectedMove2,
  resolveMove,
  resolveType,
  random = Math.random,
}) {
  if (!selectedMove1 || !selectedMove2) {
    return {
      applied: false,
      currentTurn,
      gameOver: false,
      player1Hp,
      player2Hp,
      message: "Both players must select a move before fighting.",
    };
  }

  const [moveData1, moveData2] = await Promise.all([
    resolveMove(selectedMove1.move.url),
    resolveMove(selectedMove2.move.url),
  ]);

  const firstAttacker = chooseFirstAttacker({
    move1: moveData1,
    move2: moveData2,
    player1Pokemon,
    player2Pokemon,
    currentTurn,
    random,
  });

  let hp1 = player1Hp;
  let hp2 = player2Hp;
  const messages = [];

  const runAttack = async (attackerKey) => {
    if (attackerKey === "pokemon1") {
      const result = await resolveSingleAttack({
        attackerPokemon: player1Pokemon,
        defenderPokemon: player2Pokemon,
        defenderHp: hp2,
        moveData: moveData1,
        resolveType,
        random,
      });
      hp2 = result.nextDefenderHp;
      messages.push(result.message);
      return;
    }

    const result = await resolveSingleAttack({
      attackerPokemon: player2Pokemon,
      defenderPokemon: player1Pokemon,
      defenderHp: hp1,
      moveData: moveData2,
      resolveType,
      random,
    });
    hp1 = result.nextDefenderHp;
    messages.push(result.message);
  };

  const secondAttacker = firstAttacker === "pokemon1" ? "pokemon2" : "pokemon1";

  await runAttack(firstAttacker);

  if (hp1 > 0 && hp2 > 0) {
    await runAttack(secondAttacker);
  } else {
    messages.push("The second attack was skipped because a pokemon fainted.");
  }

  const gameOver = hp1 === 0 || hp2 === 0;

  return {
    applied: true,
    currentTurn: firstAttacker,
    gameOver,
    player1Hp: hp1,
    player2Hp: hp2,
    message: messages.join(" "),
  };
}
