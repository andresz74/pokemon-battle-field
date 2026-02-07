import React, { useState } from "react";
import PokemonCard from "./PokemonCard";
import { BattleStatus } from "@/components/BattleStatus";
import { usePokemonContext } from "@/context/PokemonContext";
import { useRoomBattle } from "@/hooks/useRoomBattle";
import { PokemonMove } from "@/models";

const BattleField: React.FC = () => {
  const { pokemonList, loadingPokemonContext, errorPokemonContext } =
    usePokemonContext();
  const {
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
  } = useRoomBattle();

  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  if (error || errorPokemonContext) {
    return <div>Error: {error ?? errorPokemonContext}</div>;
  }

  if (loadingPokemonContext || !pokemonList) {
    return <div>Loading...</div>;
  }

  if (!connected || !roomState) {
    return (
      <section className="app-shell">
        <header className="app-header">
          <p className="app-kicker">Multiplayer Battle</p>
          <h1 className="app-title">Pokemon Battle Field</h1>
          <p className="app-subtitle">Create or join a room for 2-player battling.</p>

          <div className="battle-controls">
            <input
              className="battle-select"
              placeholder="Your name"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
            />
            <button
              type="button"
              className="battle-button"
              disabled={loading}
              onClick={() => createRoom(playerName || "Trainer One")}
            >
              Create Room
            </button>
          </div>

          <div className="battle-controls">
            <input
              className="battle-select"
              placeholder="Room code"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            />
            <button
              type="button"
              className="battle-button"
              disabled={loading || !joinCode.trim()}
              onClick={() => joinRoom(joinCode, playerName || "Trainer Two")}
            >
              Join Room
            </button>
          </div>
        </header>
      </section>
    );
  }

  const p1 = roomState.players.pokemon1;
  const p2 = roomState.players.pokemon2;

  const roomReady = Boolean(p1 && p2);

  const roomSubtitle = !roomReady
    ? `Room ${roomId}: waiting for second trainer`
    : `Room ${roomId} · You are ${playerSlot === "pokemon1" ? p1?.name : p2?.name}`;

  const myLocked = playerSlot ? roomState.locked[playerSlot] : false;
  let actionLabel = "Lock Move";
  if (roomState.phase === "countdown") {
    actionLabel = `Starting in ${roomState.countdown ?? 0}`;
  } else if (roomState.phase === "resolving") {
    actionLabel = "Resolving...";
  } else if (roomState.phase === "finished") {
    actionLabel = "Battle Finished";
  } else if (myLocked) {
    actionLabel = "Move Locked";
  }

  return (
    <section className="app-shell">
      <header className="app-header">
        <p className="app-kicker">Multiplayer Battle</p>
        <h1 className="app-title">Pokemon Battle Field</h1>
        <p className="app-subtitle">{roomSubtitle}</p>

        <div className="battle-controls">
          <button type="button" className="battle-button" onClick={restart}>
            Restart Room
          </button>
        </div>
      </header>

      <main className="battle-main">
        <div className="battle-grid">
          <PokemonCard
            pokemon={p1?.pokemon ?? null}
            hp={p1?.maxHp ?? null}
            currentHp={p1?.currentHp ?? null}
            moves={p1?.moves ?? []}
            setSelectedMove={(move: PokemonMove | null) =>
              selectMove("pokemon1", move)
            }
            setSelectedPokemon={(url: string) => selectPokemon("pokemon1", url)}
            isTurn={roomState.currentTurn === "pokemon1"}
            pokemonList={pokemonList}
            trainerName={p1?.name ?? "Trainer One"}
            canControl={
              playerSlot === "pokemon1" &&
              roomState.phase !== "countdown" &&
              roomState.phase !== "resolving" &&
              !roomState.locked.pokemon1
            }
            selectedMoveIndex={p1?.selectedMoveIndex ?? null}
          />

          <div className="battle-action">
            <button
              type="button"
              onClick={lockMove}
              className="battle-button battle-button-center"
              disabled={!canLockMove}
            >
              {actionLabel}
            </button>
          </div>

          <PokemonCard
            pokemon={p2?.pokemon ?? null}
            hp={p2?.maxHp ?? null}
            currentHp={p2?.currentHp ?? null}
            moves={p2?.moves ?? []}
            setSelectedMove={(move: PokemonMove | null) =>
              selectMove("pokemon2", move)
            }
            setSelectedPokemon={(url: string) => selectPokemon("pokemon2", url)}
            isTurn={roomState.currentTurn === "pokemon2"}
            pokemonList={pokemonList}
            trainerName={p2?.name ?? "Trainer Two"}
            canControl={
              playerSlot === "pokemon2" &&
              roomState.phase !== "countdown" &&
              roomState.phase !== "resolving" &&
              !roomState.locked.pokemon2
            }
            selectedMoveIndex={p2?.selectedMoveIndex ?? null}
          />
        </div>

        <div className="battle-status-row">
          <BattleStatus
            battleStarted={roomState.battleStarted}
            battleMessage={roomState.battleMessage}
            gameOver={roomState.gameOver}
            roundOrderText={roomState.roundOrderText}
            winnerName={roomState.winnerName}
          />
        </div>
      </main>
    </section>
  );
};

export default BattleField;
