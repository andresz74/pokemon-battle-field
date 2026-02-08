import { roomStore } from "@/server/roomStore";

type DurableObjectIdLike = unknown;

interface DurableObjectStubLike {
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

interface DurableObjectNamespaceLike {
  idFromName: (name: string) => DurableObjectIdLike;
  get: (id: DurableObjectIdLike) => DurableObjectStubLike;
}

type RoomAction = "select_pokemon" | "select_move" | "lock_move" | "restart";

function generateRoomId(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function getRoomDoNamespace(): Promise<DurableObjectNamespaceLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const ns = (context?.env as Record<string, unknown> | undefined)?.ROOM_DO;

    if (
      ns &&
      typeof ns === "object" &&
      typeof (ns as DurableObjectNamespaceLike).idFromName === "function" &&
      typeof (ns as DurableObjectNamespaceLike).get === "function"
    ) {
      return ns as DurableObjectNamespaceLike;
    }

    return null;
  } catch {
    return null;
  }
}

async function doRequest<T>(roomId: string, path: string, init?: RequestInit): Promise<T> {
  const namespace = await getRoomDoNamespace();
  if (!namespace) {
    throw new Error("ROOM_DO binding is not configured");
  }

  const id = namespace.idFromName(roomId.toUpperCase());
  const stub = namespace.get(id);
  const res = await stub.fetch(`https://room.internal${path}`, init);
  const payload = (await res.json()) as T | { error?: string };

  if (!res.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload
        ? (payload as { error?: string }).error ?? "Request failed"
        : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export const roomGateway = {
  async createRoom(playerName: string) {
    const namespace = await getRoomDoNamespace();
    if (!namespace) {
      return roomStore.createRoom(playerName);
    }

    for (let i = 0; i < 8; i += 1) {
      const roomId = generateRoomId(6);
      try {
        return await doRequest<{
          roomId: string;
          playerId: string;
          slot: "pokemon1" | "pokemon2";
          state: unknown;
        }>(roomId, "/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ playerName, roomId }),
        });
      } catch (error) {
        if ((error as Error).message !== "Room already exists") {
          throw error;
        }
      }
    }

    throw new Error("Failed to allocate room id");
  },

  async joinRoom(roomId: string, playerName: string) {
    const namespace = await getRoomDoNamespace();
    if (!namespace) {
      return roomStore.joinRoom(roomId, playerName);
    }

    return doRequest<{
      roomId: string;
      playerId: string;
      slot: "pokemon1" | "pokemon2";
      state: unknown;
    }>(roomId, "/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
  },

  async getState(roomId: string) {
    const namespace = await getRoomDoNamespace();
    if (!namespace) {
      return roomStore.getState(roomId);
    }

    return doRequest(roomId, "/state", { method: "GET" });
  },

  async action(
    roomId: string,
    payload: {
      playerId: string;
      action: RoomAction;
      pokemonUrl?: string;
      moveIndex?: number | null;
    }
  ) {
    const namespace = await getRoomDoNamespace();
    if (!namespace) {
      if (payload.action === "select_pokemon") {
        return roomStore.selectPokemon(roomId, payload.playerId, String(payload.pokemonUrl ?? ""));
      }
      if (payload.action === "select_move") {
        return roomStore.selectMove(roomId, payload.playerId, payload.moveIndex ?? null);
      }
      if (payload.action === "lock_move") {
        return roomStore.lockMove(roomId, payload.playerId);
      }
      return roomStore.restart(roomId, payload.playerId);
    }

    return doRequest(roomId, "/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};
