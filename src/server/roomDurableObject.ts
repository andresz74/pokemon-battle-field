import _ from "lodash";
import { applyTurn, getHpStat } from "@/lib/battle";
import { Pokemon, PokemonMove } from "@/models";
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

interface ActionBody {
  playerId: string;
  action: "select_pokemon" | "select_move" | "lock_move" | "restart";
  pokemonUrl?: string;
  moveIndex?: number | null;
}

interface DurableObjectStateLike {
  storage: {
    get: <T>(key: string) => Promise<T | undefined>;
    put: (key: string, value: unknown) => Promise<void>;
  };
  id: { toString: () => string };
}

function now() {
  return Date.now();
}

function generateId(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
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

export class RoomDurableObject {
  private state: DurableObjectStateLike;
  private room: Room | null = null;

  constructor(state: DurableObjectStateLike) {
    this.state = state;
  }

  private async loadRoom() {
    if (this.room) {
      return this.room;
    }

    const room = (await this.state.storage.get<Room>("room")) ?? null;
    this.room = room;
    return room;
  }

  private async saveRoom(room: Room) {
    this.room = room;
    await this.state.storage.put("room", room);
  }

  private requireRoom(room: Room | null): Room {
    if (!room) {
      throw new Error("Room not found");
    }

    return room;
  }

  private async resolveRound(room: Room) {
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

  private async maybeAdvanceCountdown(room: Room): Promise<boolean> {
    let changed = false;

    if (room.phase !== "countdown" || !room.countdownStartedAt) {
      return changed;
    }

    const elapsedMs = now() - room.countdownStartedAt;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const remaining = Math.max(0, 3 - elapsedSeconds);

    if (room.countdown !== remaining) {
      room.countdown = remaining;
      room.updatedAt = now();
      changed = true;
    }

    if (remaining > 0) {
      const nextMessage = `Round starts in ${remaining}...`;
      if (room.battleMessage !== nextMessage) {
        room.battleMessage = nextMessage;
        room.updatedAt = now();
        changed = true;
      }
      return changed;
    }

    room.phase = "resolving";
    room.battleMessage = "Resolving round...";
    changed = true;

    try {
      await this.resolveRound(room);
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

  private async setPlayerPokemon(room: Room, player: RoomPlayer, pokemonUrl: string) {
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

  private async create(playerName: string, roomId: string) {
    const existing = await this.loadRoom();
    if (existing) {
      throw new Error("Room already exists");
    }

    const room: Room = {
      id: roomId,
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

    await this.saveRoom(room);

    const firstPlayer = room.players.pokemon1;
    if (!firstPlayer) {
      throw new Error("Failed to create first player");
    }

    return {
      roomId: room.id,
      playerId: firstPlayer.id,
      slot: "pokemon1" as Slot,
      state: toPublicState(room),
    };
  }

  private async join(playerName: string) {
    const room = this.requireRoom(await this.loadRoom());
    await this.maybeAdvanceCountdown(room);

    if (room.players.pokemon2) {
      throw new Error("Room is full");
    }

    room.players.pokemon2 = createPlayer(playerName, "pokemon2");
    room.phase = "lobby";
    room.updatedAt = now();
    room.battleMessage = "Both trainers connected. Select your pokemon.";

    await this.saveRoom(room);

    return {
      roomId: room.id,
      playerId: room.players.pokemon2.id,
      slot: "pokemon2" as Slot,
      state: toPublicState(room),
    };
  }

  private async stateResponse() {
    const room = this.requireRoom(await this.loadRoom());
    const changed = await this.maybeAdvanceCountdown(room);
    if (changed) {
      await this.saveRoom(room);
    }
    return toPublicState(room);
  }

  private async action(input: ActionBody) {
    const room = this.requireRoom(await this.loadRoom());
    await this.maybeAdvanceCountdown(room);

    const player = getPlayer(room, input.playerId);
    if (!player) {
      throw new Error("Player not in room");
    }

    if (input.action === "select_pokemon") {
      if (!input.pokemonUrl) {
        throw new Error("pokemonUrl is required");
      }
      if (room.phase === "countdown" || room.phase === "resolving") {
        throw new Error("Cannot change pokemon while round is resolving");
      }
      await this.setPlayerPokemon(room, player, input.pokemonUrl);
      room.updatedAt = now();
      await this.saveRoom(room);
      return toPublicState(room);
    }

    if (input.action === "select_move") {
      if (room.phase === "countdown" || room.phase === "resolving") {
        throw new Error("Round already started");
      }

      if (room.locked[player.slot]) {
        throw new Error("Move already locked for this round");
      }

      const moveIndex = input.moveIndex ?? null;
      if (moveIndex === null) {
        player.selectedMoveIndex = null;
      } else if (moveIndex >= 0 && moveIndex < player.moves.length) {
        player.selectedMoveIndex = moveIndex;
      } else {
        throw new Error("Invalid move selection");
      }

      room.updatedAt = now();
      await this.saveRoom(room);
      return toPublicState(room);
    }

    if (input.action === "lock_move") {
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
      await this.saveRoom(room);
      return toPublicState(room);
    }

    if (input.action === "restart") {
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

      await this.saveRoom(room);
      return toPublicState(room);
    }

    throw new Error("Invalid action");
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const roomId = this.state.id.toString().split(":").pop() ?? "ROOM";

      if (request.method === "POST" && pathname === "/create") {
        const body = (await request.json()) as { playerName?: string };
        const result = await this.create(body.playerName ?? "Trainer One", roomId);
        return jsonResponse(result);
      }

      if (request.method === "POST" && pathname === "/join") {
        const body = (await request.json()) as { playerName?: string };
        const result = await this.join(body.playerName ?? "Trainer Two");
        return jsonResponse(result);
      }

      if (request.method === "GET" && pathname === "/state") {
        const result = await this.stateResponse();
        return jsonResponse(result);
      }

      if (request.method === "POST" && pathname === "/action") {
        const body = (await request.json()) as ActionBody;
        const result = await this.action(body);
        return jsonResponse(result);
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 400);
    }
  }
}
