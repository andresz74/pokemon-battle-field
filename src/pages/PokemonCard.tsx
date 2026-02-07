import React from "react";
import Image from "next/image";
import { SearchablePokemonSelect } from "@/components/SearchablePokemonSelect";
import { Pokemon, PokemonMove, PokemonListItem } from "../models";

interface PokemonCardProps {
  pokemon: Pokemon | null;
  hp: number | null;
  currentHp: number | null;
  moves: PokemonMove[];
  isTurn: boolean;
  pokemonList: PokemonListItem[] | undefined;
  setSelectedMove: (move: PokemonMove | null) => void;
  setSelectedPokemon: (url: string) => void;
  trainerName: string;
  canControl?: boolean;
  selectedMoveIndex?: number | null;
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  hp,
  currentHp,
  moves,
  isTurn,
  pokemonList,
  setSelectedMove,
  setSelectedPokemon,
  trainerName,
  canControl = true,
  selectedMoveIndex = null,
}) => {
  const imageSrc = pokemon?.sprites.front_default ?? "";

  const handleMoveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const moveIndex = parseInt(e.target.value, 10);
    if (!isNaN(moveIndex)) {
      setSelectedMove(moves[moveIndex]);
      return;
    }

    setSelectedMove(null);
  };

  if (!pokemonList) {
    return <div>Loading...</div>;
  }

  const hpPercent =
    hp && currentHp !== null && hp > 0
      ? Math.max(0, Math.min(100, Math.round((currentHp / hp) * 100)))
      : 0;
  const canSelectMove = Boolean(pokemon && moves.length > 0);

  return (
    <article className={`pokemon-card ${isTurn ? "active" : ""}`}>
      <div className="pokemon-card-head">
        <p className="trainer-label">{trainerName}</p>
        <span className={`turn-chip ${isTurn ? "" : "idle"}`}>
          {isTurn ? "Opening Move" : "Follow-Up"}
        </span>
      </div>

      <SearchablePokemonSelect
        pokemonList={pokemonList}
        selectedName={pokemon?.name}
        disabled={!canControl}
        onSelectPokemon={setSelectedPokemon}
      />

      <div className="pokemon-visual">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={pokemon?.name ?? "Pokemon"}
            width={156}
            height={156}
            priority={false}
          />
        ) : (
          <div style={{ width: 156, height: 156 }} />
        )}
      </div>

      <h2 className="pokemon-name">{pokemon?.name ?? "No pokemon selected"}</h2>

      <div className="hp-wrap">
        <p className="hp-meta">
          HP {currentHp ?? 0} / {hp ?? 0}
        </p>
        <div className="hp-bar">
          <div
            className={`hp-value ${hpPercent <= 25 ? "low" : ""}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      <select
        onChange={handleMoveChange}
        value={selectedMoveIndex ?? ""}
        disabled={!canControl || !canSelectMove}
        className="battle-select"
      >
        <option value="">
          {canSelectMove ? "Select your move" : "Select a pokemon first"}
        </option>
        {moves.map((move, index) => (
          <option key={move.move.name} value={index}>
            {move.move.name}
          </option>
        ))}
      </select>
    </article>
  );
};

export default PokemonCard;
