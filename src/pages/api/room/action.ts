import type { NextApiRequest, NextApiResponse } from "next";
import { roomStore } from "@/server/roomStore";

type Action = "select_pokemon" | "select_move" | "lock_move" | "restart";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const roomId = String(req.body?.roomId ?? "").toUpperCase();
    const playerId = String(req.body?.playerId ?? "");
    const action = String(req.body?.action ?? "") as Action;

    let state;
    if (action === "select_pokemon") {
      state = await roomStore.selectPokemon(roomId, playerId, String(req.body?.pokemonUrl ?? ""));
    } else if (action === "select_move") {
      const rawMoveIndex = req.body?.moveIndex;
      const moveIndex = rawMoveIndex === null ? null : Number(rawMoveIndex);
      state = roomStore.selectMove(roomId, playerId, Number.isNaN(moveIndex as number) ? null : moveIndex);
    } else if (action === "lock_move") {
      state = roomStore.lockMove(roomId, playerId);
    } else if (action === "restart") {
      state = roomStore.restart(roomId, playerId);
    } else {
      throw new Error("Invalid action");
    }

    res.status(200).json(state);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
