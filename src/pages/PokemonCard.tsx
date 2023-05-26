import React from "react";
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
}) => {
  const imageSrc = pokemon?.sprites.front_default ?? "";
  const handlePokemonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPokemon(e.target.value);
  };

  const handleMoveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const moveIndex = parseInt(e.target.value);
    if (!isNaN(moveIndex)) {
      // check if the value is a number
      setSelectedMove(moves[moveIndex]);
    } else {
      setSelectedMove(null);
    }
  };

  if (!pokemonList) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`pokemon-card ${isTurn ? "active" : ""}`}>
      <select onChange={handlePokemonChange}>
        <option value="">Select your pokemon</option>
        {pokemonList.map((p, i) => (
          <option key={i} value={p.url}>
            {p.name}
          </option>
        ))}
      </select>
      <img src={imageSrc} alt={pokemon?.name} width={96} height={96} />
      <h2>{pokemon?.name}</h2>
      <p>
        HP: {currentHp} / {hp}
      </p>
      <select onChange={handleMoveChange} disabled={!isTurn}>
        <option value="">Select your move</option>
        {moves.map((move, index) => (
          <option key={index} value={index}>
            {move.move.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PokemonCard;
