import type { NextApiRequest, NextApiResponse } from "next";
import { roomGateway } from "@/server/roomDoClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const roomId = String(req.body?.roomId ?? "").toUpperCase();
    const playerName = String(req.body?.playerName ?? "Trainer Two");
    const result = await roomGateway.joinRoom(roomId, playerName);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
