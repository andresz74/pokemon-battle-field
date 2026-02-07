import _ from "lodash";
import { Pokemon, PokemonMove } from "@/models";
import { applyTurn, getHpStat } from "@/lib/battle";
import {
  fetchMoveByUrl,
  fetchPokemonByUrl,
  fetchTypeByName,
} from "@/services/pokemonService";

type Slot = "pokemon1" | "pokemon2";
type RoomPhase =
  | "lobby"
  | "selecting"
  | "countdown"
  | "resolving"
  | "result"
  | "finished";

interface RoomPlayer {
  id: string;
  name: string;
  slot: Slot;
  pokemon: Pokemon | null;
  pokemonUrl: string | null;
  moves: PokemonMove[];
  selectedMoveIndex: number | null;
  currentHp: number | null;
  maxHp: number | null;
}

interface Room {
  id: string;
  createdAt: number;
  updatedAt: number;
  players: {
    pokemon1: RoomPlayer | null;
    pokemon2: RoomPlayer | null;
  };
  gameOver: boolean;
  battleStarted: boolean;
  currentTurn: Slot;
  battleMessage: string;
  roundOrderText: string;
  winnerName: string | null;
  phase: RoomPhase;
  countdown: number | null;
  countdownStartedAt: number | null;
  locked: {
    pokemon1: boolean;
    pokemon2: boolean;
  };
}

type RoomStoreGlobal = typeof globalThis & {
  __POKEMON_ROOM_STORE__?: Map<string, Room>;
};

type KVNamespaceLike = {
  get: (key: string, options?: "text" | "json") => Promise<unknown>;
  put: (key: string, value: string) => Promise<void>;
};

const globalRoomStore = globalThis as RoomStoreGlobal;
if (!globalRoomStore.__POKEMON_ROOM_STORE__) {
  globalRoomStore.__POKEMON_ROOM_STORE__ = new Map<string, Room>();
}

const rooms = globalRoomStore.__POKEMON_ROOM_STORE__;

function now() {
  return Date.now();
}

function generateId(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function createPlayer(name: string, slot: Slot): RoomPlayer {
  return {
    id: generateId(10),
    name: name.trim() || (slot === "pokemon1" ? "Trainer One" : "Trainer Two"),
    slot,
    pokemon: null,
    pokemonUrl: null,
    moves: [],
    selectedMoveIndex: null,
    currentHp: null,
    maxHp: null,
  };
}

function normalizePlayer(player: RoomPlayer | null) {
  if (!player) {
    return null;
  }

  return {
    id: player.id,
    name: player.name,
    slot: player.slot,
    pokemon: player.pokemon,
    pokemonUrl: player.pokemonUrl,
    moves: player.moves,
    selectedMoveIndex: player.selectedMoveIndex,
    currentHp: player.currentHp,
    maxHp: player.maxHp,
  };
}

function toPublicState(room: Room) {
  return {
    roomId: room.id,
    battleStarted: room.battleStarted,
    gameOver: room.gameOver,
    currentTurn: room.currentTurn,
    battleMessage: room.battleMessage,
    roundOrderText: room.roundOrderText,
    winnerName: room.winnerName,
    phase: room.phase,
    countdown: room.countdown,
    locked: room.locked,
    players: {
      pokemon1: normalizePlayer(room.players.pokemon1),
      pokemon2: normalizePlayer(room.players.pokemon2),
    },
    updatedAt: room.updatedAt,
  };
}

function getPlayer(room: Room, playerId: string): RoomPlayer | null {
  if (room.players.pokemon1?.id === playerId) {
    return room.players.pokemon1;
  }

  if (room.players.pokemon2?.id === playerId) {
    return room.players.pokemon2;
  }

  return null;
}

async function getKvNamespace(): Promise<KVNamespaceLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const maybeKv = (context?.env as Record<string, unknown> | undefined)?.ROOMS_KV;

    if (
      maybeKv &&
      typeof maybeKv === "object" &&
      typeof (maybeKv as KVNamespaceLike).get === "function" &&
      typeof (maybeKv as KVNamespaceLike).put === "function"
    ) {
      return maybeKv as KVNamespaceLike;
    }

    return null;
  } catch {
    return null;
  }
}

async function readRoom(roomId: string): Promise<Room | null> {
  const kv = await getKvNamespace();
  if (kv) {
    const raw = (await kv.get(`room:${roomId}`, "json")) as Room | null;
    if (raw) {
      return raw;
    }
  }

  return rooms.get(roomId) ?? null;
}

async function writeRoom(room: Room): Promise<void> {
  rooms.set(room.id, room);

  const kv = await getKvNamespace();
  if (kv) {
    await kv.put(`room:${room.id}`, JSON.stringify(room));
  }
}

async function requireRoom(roomId: string): Promise<Room> {
  const room = await readRoom(roomId);
  if (!room) {
    throw new Error("Room not found");
  }
  return room;
}

async function resolveRound(room: Room) {
  const p1 = room.players.pokemon1;
  const p2 = room.players.pokemon2;
  if (!p1 || !p2) {
    throw new Error("Both players must be connected");
  }

  if (!p1.pokemon || !p2.pokemon) {
    throw new Error("Both players must select a pokemon");
  }

  if (p1.currentHp === null || p2.currentHp === null) {
    throw new Error("HP state is invalid");
  }

  const move1 = p1.selectedMoveIndex !== null ? p1.moves[p1.selectedMoveIndex] : null;
  const move2 = p2.selectedMoveIndex !== null ? p2.moves[p2.selectedMoveIndex] : null;

  const result = await applyTurn({
    currentTurn: room.currentTurn,
    player1Pokemon: p1.pokemon,
    player2Pokemon: p2.pokemon,
    player1Hp: p1.currentHp,
    player2Hp: p2.currentHp,
    selectedMove1: move1,
    selectedMove2: move2,
    resolveMove: fetchMoveByUrl,
    resolveType: fetchTypeByName,
  });

  if (!result.applied) {
    room.battleMessage = result.message;
    return;
  }

  p1.currentHp = result.player1Hp;
  p2.currentHp = result.player2Hp;
  p1.selectedMoveIndex = null;
  p2.selectedMoveIndex = null;

  room.currentTurn = result.currentTurn;
  room.gameOver = result.gameOver;
  room.battleMessage = result.message;
  room.roundOrderText = `Round order: ${
    result.currentTurn === "pokemon1" ? p1.name : p2.name
  } acted first.`;

  if (result.gameOver) {
    room.winnerName = result.player1Hp > result.player2Hp ? p1.pokemon.name : p2.pokemon.name;
    room.phase = "finished";
  } else {
    room.phase = "result";
  }
}

async function maybeAdvanceCountdown(room: Room): Promise<boolean> {
  let changed = false;

  if (room.phase !== "countdown" || !room.countdownStartedAt) {
    return changed;
  }

  const elapsedMs = now() - room.countdownStartedAt;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remaining = Math.max(0, 3 - elapsedSeconds);

  room.countdown = remaining;
  room.updatedAt = now();
  changed = true;

  if (remaining > 0) {
    room.battleMessage = `Round starts in ${remaining}...`;
    return changed;
  }

  room.phase = "resolving";
  room.battleMessage = "Resolving round...";
  changed = true;

  try {
    await resolveRound(room);
    if (!room.gameOver) {
      room.phase = "selecting";
      room.battleMessage = `${room.battleMessage} Choose next moves and lock in.`;
    }
  } catch (error) {
    room.phase = "selecting";
    room.battleMessage = `Round failed: ${(error as Error).message}`;
  } finally {
    room.locked.pokemon1 = false;
    room.locked.pokemon2 = false;
    room.countdown = null;
    room.countdownStartedAt = null;
    room.updatedAt = now();
    changed = true;
  }

  return changed;
}

async function setPlayerPokemon(room: Room, player: RoomPlayer, pokemonUrl: string) {
  const pokemon = await fetchPokemonByUrl(pokemonUrl);
  const moves = _.sampleSize(pokemon.moves, 5);
  const hp = getHpStat(pokemon);

  player.pokemon = pokemon;
  player.pokemonUrl = pokemonUrl;
  player.moves = moves;
  player.selectedMoveIndex = null;
  player.maxHp = hp;
  player.currentHp = hp;

  room.locked[player.slot] = false;

  const p1 = room.players.pokemon1;
  const p2 = room.players.pokemon2;
  if (p1?.pokemon && p2?.pokemon) {
    room.battleStarted = true;
    room.gameOver = false;
    room.winnerName = null;
    room.phase = "selecting";
    room.battleMessage = "Both trainers selected a pokemon. Select your move and lock in.";
    room.roundOrderText = "Round order: Trainer One acts first on tie-break.";
    room.countdown = null;
    room.countdownStartedAt = null;
  }
}

export const roomStore = {
  async createRoom(playerName: string) {
    let id = generateId(6);
    while (await readRoom(id)) {
      id = generateId(6);
    }

    const room: Room = {
      id,
      createdAt: now(),
      updatedAt: now(),
      players: {
        pokemon1: createPlayer(playerName, "pokemon1"),
        pokemon2: null,
      },
      gameOver: false,
      battleStarted: false,
      currentTurn: "pokemon1",
      battleMessage: "Waiting for second trainer to join.",
      roundOrderText: "Round order: Trainer One acts first on tie-break.",
      winnerName: null,
      phase: "lobby",
      countdown: null,
      countdownStartedAt: null,
      locked: {
        pokemon1: false,
        pokemon2: false,
      },
    };

    await writeRoom(room);

    const firstPlayer = room.players.pokemon1;
    if (!firstPlayer) {
      throw new Error("Failed to create first player");
    }

    return {
      roomId: id,
      playerId: firstPlayer.id,
      slot: "pokemon1" as Slot,
      state: toPublicState(room),
    };
  },

  async joinRoom(roomId: string, playerName: string) {
    const room = await requireRoom(roomId);
    await maybeAdvanceCountdown(room);

    if (room.players.pokemon2) {
      throw new Error("Room is full");
    }

    room.players.pokemon2 = createPlayer(playerName, "pokemon2");
    room.phase = "lobby";
    room.updatedAt = now();
    room.battleMessage = "Both trainers connected. Select your pokemon.";

    await writeRoom(room);

    return {
      roomId,
      playerId: room.players.pokemon2.id,
      slot: "pokemon2" as Slot,
      state: toPublicState(room),
    };
  },

  async getState(roomId: string) {
    const room = await requireRoom(roomId);
    const changed = await maybeAdvanceCountdown(room);
    if (changed) {
      await writeRoom(room);
    }
    return toPublicState(room);
  },

  async selectPokemon(roomId: string, playerId: string, pokemonUrl: string) {
    const room = await requireRoom(roomId);
    await maybeAdvanceCountdown(room);

    const player = getPlayer(room, playerId);
    if (!player) {
      throw new Error("Player not in room");
    }

    if (room.phase === "countdown" || room.phase === "resolving") {
      throw new Error("Cannot change pokemon while round is resolving");
    }

    await setPlayerPokemon(room, player, pokemonUrl);
    room.updatedAt = now();
    await writeRoom(room);
    return toPublicState(room);
  },

  async selectMove(roomId: string, playerId: string, moveIndex: number | null) {
    const room = await requireRoom(roomId);
    await maybeAdvanceCountdown(room);

    const player = getPlayer(room, playerId);
    if (!player) {
      throw new Error("Player not in room");
    }

    if (room.phase === "countdown" || room.phase === "resolving") {
      throw new Error("Round already started");
    }

    if (room.locked[player.slot]) {
      throw new Error("Move already locked for this round");
    }

    if (moveIndex === null) {
      player.selectedMoveIndex = null;
    } else if (moveIndex >= 0 && moveIndex < player.moves.length) {
      player.selectedMoveIndex = moveIndex;
    } else {
      throw new Error("Invalid move selection");
    }

    room.updatedAt = now();
    await writeRoom(room);
    return toPublicState(room);
  },

  async lockMove(roomId: string, playerId: string) {
    const room = await requireRoom(roomId);
    await maybeAdvanceCountdown(room);

    const player = getPlayer(room, playerId);
    if (!player) {
      throw new Error("Player not in room");
    }

    if (!room.battleStarted || room.gameOver) {
      throw new Error("Battle is not active");
    }

    if (room.phase === "countdown" || room.phase === "resolving") {
      throw new Error("Round already started");
    }

    if (player.selectedMoveIndex === null) {
      throw new Error("Select a move before locking");
    }

    room.locked[player.slot] = true;

    if (room.locked.pokemon1 && room.locked.pokemon2) {
      room.phase = "countdown";
      room.countdown = 3;
      room.countdownStartedAt = now();
      room.battleMessage = "Both moves locked. Round starts in 3...";
    } else {
      room.phase = "selecting";
      room.battleMessage = `${player.name} locked a move. Waiting for opponent.`;
    }

    room.updatedAt = now();
    await writeRoom(room);
    return toPublicState(room);
  },

  async restart(roomId: string, playerId: string) {
    const room = await requireRoom(roomId);
    await maybeAdvanceCountdown(room);

    const player = getPlayer(room, playerId);
    if (!player) {
      throw new Error("Player not in room");
    }

    const resetPlayer = (slotPlayer: RoomPlayer | null) => {
      if (!slotPlayer) {
        return;
      }
      slotPlayer.pokemon = null;
      slotPlayer.pokemonUrl = null;
      slotPlayer.moves = [];
      slotPlayer.selectedMoveIndex = null;
      slotPlayer.currentHp = null;
      slotPlayer.maxHp = null;
    };

    resetPlayer(room.players.pokemon1);
    resetPlayer(room.players.pokemon2);

    room.battleStarted = false;
    room.gameOver = false;
    room.currentTurn = "pokemon1";
    room.winnerName = null;
    room.phase = "lobby";
    room.countdown = null;
    room.countdownStartedAt = null;
    room.locked.pokemon1 = false;
    room.locked.pokemon2 = false;
    room.roundOrderText = "Round order: Trainer One acts first on tie-break.";
    room.battleMessage = "Battle restarted. Select pokemon again.";
    room.updatedAt = now();

    await writeRoom(room);
    return toPublicState(room);
  },
};
