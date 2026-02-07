import type { NextApiRequest, NextApiResponse } from "next";
import { roomStore } from "@/server/roomStore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const roomId = String(req.query.roomId ?? "").toUpperCase();
    const state = await roomStore.getState(roomId);
    res.status(200).json(state);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
