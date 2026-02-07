import type { NextApiRequest, NextApiResponse } from "next";
import { roomStore } from "@/server/roomStore";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const playerName = String(req.body?.playerName ?? "Trainer One");
    const result = roomStore.createRoom(playerName);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
