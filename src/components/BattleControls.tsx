import React from "react";

interface BattleControlsProps {
  battleStarted: boolean;
  canStartBattle: boolean;
  onNewBattle: () => void;
  onRestart: () => void;
  onStartBattle: () => void;
}

export const BattleControls: React.FC<BattleControlsProps> = ({
  battleStarted,
  canStartBattle,
  onNewBattle,
  onRestart,
  onStartBattle,
}) => {
  return (
    <div className="battle-controls">
      <button type="button" onClick={onNewBattle} className="battle-button">
        New Battle
      </button>

      <button type="button" onClick={onRestart} className="battle-button">
        Restart
      </button>

      {!battleStarted && (
        <button
          type="button"
          onClick={onStartBattle}
          className="battle-button"
          disabled={!canStartBattle}
        >
          Start Battle
        </button>
      )}
    </div>
  );
};
