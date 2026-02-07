import React from "react";

interface BattleStatusProps {
  battleStarted: boolean;
  battleMessage: string;
  gameOver: boolean;
  roundOrderText: string;
  winnerName: string | null;
}

export const BattleStatus: React.FC<BattleStatusProps> = ({
  battleStarted,
  battleMessage,
  gameOver,
  roundOrderText,
  winnerName,
}) => {
  if (!battleStarted) {
    return null;
  }

  const normalizedMessage = battleMessage.trim();
  const [firstSentence, ...rest] = normalizedMessage.split(". ");
  const detail = rest.length ? rest.join(". ") : firstSentence;
  const compactDetail =
    detail.length > 110 ? `${detail.slice(0, 107).trimEnd()}...` : detail;

  return (
    <div className={`battle-status ${gameOver ? "ended" : "active"}`}>
      <p className="battle-status-title">
        {gameOver ? `Winner: ${winnerName ?? "Unknown"}` : "Battle Live"}
      </p>
      <p className="battle-status-order">{roundOrderText}</p>
      <p className="battle-status-detail">{compactDetail}</p>
    </div>
  );
};
