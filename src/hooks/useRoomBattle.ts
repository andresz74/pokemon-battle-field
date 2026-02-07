import { useCallback, useEffect, useMemo, useState } from "react";
import { Pokemon, PokemonMove } from "@/models";

interface RoomPlayerState {
  id: string;
  name: string;
  slot: "pokemon1" | "pokemon2";
  pokemon: Pokemon | null;
  pokemonUrl: string | null;
  moves: PokemonMove[];
  selectedMoveIndex: number | null;
  currentHp: number | null;
  maxHp: number | null;
}

type RoomPhase =
  | "lobby"
  | "selecting"
  | "countdown"
  | "resolving"
  | "result"
  | "finished";

interface RoomState {
  roomId: string;
  battleStarted: boolean;
  gameOver: boolean;
  currentTurn: "pokemon1" | "pokemon2";
  battleMessage: string;
  roundOrderText: string;
  winnerName: string | null;
  phase: RoomPhase;
  countdown: number | null;
  locked: {
    pokemon1: boolean;
    pokemon2: boolean;
  };
  players: {
    pokemon1: RoomPlayerState | null;
    pokemon2: RoomPlayerState | null;
  };
  updatedAt: number;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data as T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Request failed");
  }
  return data as T;
}

export const useRoomBattle = () => {
  const [roomId, setRoomId] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [playerSlot, setPlayerSlot] = useState<"pokemon1" | "pokemon2" | null>(
    null
  );
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = Boolean(roomId && playerId && roomState);

  const pollState = useCallback(async () => {
    if (!roomId) {
      return;
    }

    try {
      const state = await getJson<RoomState>(
        `/api/room/state?roomId=${encodeURIComponent(roomId)}`
      );
      setRoomState(state);
      setError(null);
    } catch (pollError) {
      setError((pollError as Error).message);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    pollState();
    const timer = window.setInterval(pollState, 700);
    return () => window.clearInterval(timer);
  }, [roomId, pollState]);

  const createRoom = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postJson<{
        roomId: string;
        playerId: string;
        slot: "pokemon1" | "pokemon2";
        state: RoomState;
      }>("/api/room/create", { playerName: name });

      setRoomId(result.roomId);
      setPlayerId(result.playerId);
      setPlayerSlot(result.slot);
      setRoomState(result.state);
    } catch (createError) {
      setError((createError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (incomingRoomId: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await postJson<{
        roomId: string;
        playerId: string;
        slot: "pokemon1" | "pokemon2";
        state: RoomState;
      }>("/api/room/join", {
        roomId: incomingRoomId.toUpperCase(),
        playerName: name,
      });

      setRoomId(result.roomId);
      setPlayerId(result.playerId);
      setPlayerSlot(result.slot);
      setRoomState(result.state);
    } catch (joinError) {
      setError((joinError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendAction = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      if (!roomId || !playerId) {
        return;
      }

      const nextState = await postJson<RoomState>("/api/room/action", {
        roomId,
        playerId,
        action,
        ...payload,
      });
      setRoomState(nextState);
    },
    [roomId, playerId]
  );

  const selectPokemon = useCallback(
    async (slot: "pokemon1" | "pokemon2", url: string) => {
      if (slot !== playerSlot) {
        return;
      }
      try {
        await sendAction("select_pokemon", { pokemonUrl: url });
      } catch (actionError) {
        setError((actionError as Error).message);
      }
    },
    [playerSlot, sendAction]
  );

  const selectMove = useCallback(
    async (slot: "pokemon1" | "pokemon2", move: PokemonMove | null) => {
      if (!roomState || slot !== playerSlot) {
        return;
      }

      if (roomState.phase === "countdown" || roomState.phase === "resolving") {
        return;
      }

      const player = roomState.players[slot];
      if (!player) {
        return;
      }

      const moveIndex =
        move === null
          ? null
          : player.moves.findIndex((m) => m.move.name === move.move.name);

      try {
        await sendAction("select_move", { moveIndex });
      } catch (actionError) {
        setError((actionError as Error).message);
      }
    },
    [playerSlot, roomState, sendAction]
  );

  const lockMove = useCallback(async () => {
    try {
      await sendAction("lock_move");
    } catch (actionError) {
      setError((actionError as Error).message);
    }
  }, [sendAction]);

  const restart = useCallback(async () => {
    try {
      await sendAction("restart");
    } catch (actionError) {
      setError((actionError as Error).message);
    }
  }, [sendAction]);

  const canLockMove = useMemo(() => {
    if (!roomState || !playerSlot || !roomState.battleStarted || roomState.gameOver) {
      return false;
    }

    if (roomState.phase === "countdown" || roomState.phase === "resolving") {
      return false;
    }

    const me = roomState.players[playerSlot];
    if (!me || !me.pokemon || me.selectedMoveIndex === null) {
      return false;
    }

    return roomState.locked[playerSlot] === false;
  }, [playerSlot, roomState]);

  return {
    canLockMove,
    connected,
    createRoom,
    error,
    joinRoom,
    loading,
    lockMove,
    playerSlot,
    restart,
    roomId,
    roomState,
    selectMove,
    selectPokemon,
  };
};
