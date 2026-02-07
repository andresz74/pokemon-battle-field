import type { NextApiRequest, NextApiResponse } from "next";
import { roomGateway } from "@/server/roomDoClient";

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

    if (action !== "select_pokemon" && action !== "select_move" && action !== "lock_move" && action !== "restart") {
      throw new Error("Invalid action");
    }

    const rawMoveIndex = req.body?.moveIndex;
    const moveIndex = rawMoveIndex === null ? null : Number(rawMoveIndex);
    const state = await roomGateway.action(roomId, {
      playerId,
      action,
      pokemonUrl: String(req.body?.pokemonUrl ?? ""),
      moveIndex: Number.isNaN(moveIndex as number) ? null : moveIndex,
    });

    res.status(200).json(state);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
