import React from "react";
import Image from "next/image";
import _ from "lodash";
import { Pokemon, PokemonMove } from "../models";

interface PokemonCardProps {
  pokemon: Pokemon;
  hp: number | null;
  currentHp: number | null;
  moves: PokemonMove[];
  setSelectedMove: (move: PokemonMove | null) => void;
  isTurn: boolean;
}

// helper function to pick random elements
function pickRandom<T>(arr: T[], count: number): T[] {
  return _.sampleSize(arr, count);
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  hp,
  currentHp,
  moves,
  setSelectedMove,
  isTurn,
}) => {
  const imageSrc = pokemon.sprites.front_default ?? "";
  const randomMoves = React.useMemo(() => pickRandom(moves, 5), [moves]);
  const handleMoveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const moveIndex = parseInt(e.target.value);
    if (!isNaN(moveIndex)) {
      // check if the value is a number
      setSelectedMove(randomMoves[moveIndex]);
    } else {
      setSelectedMove(null);
    }
  };
  return (
    <div className={`pokemon-card ${isTurn ? "active" : ""}`}>
      {/* <Image src={imageSrc} alt={pokemon.name} width={96} height={96} /> */}
      <img src={imageSrc} alt={pokemon.name} width={96} height={96} />
      <h2>{pokemon.name}</h2>
      <p>
        HP: {currentHp} / {hp}
      </p>
      <select
        // value={selectedMoveIndex}
        onChange={handleMoveChange}
        disabled={!isTurn}
      >
        <option value="">Select your move</option>
        {randomMoves.map((move, index) => (
          <option key={index} value={index}>
            {move.move.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PokemonCard;
