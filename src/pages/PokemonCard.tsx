import React from "react";
import Image from "next/image";
import { Pokemon } from "../models";

interface PokemonCardProps {
  pokemon: Pokemon;
  currentHp: number;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, currentHp }) => {
  const imageSrc = pokemon.sprites.front_default ?? "";
  return (
    <div className="pokemon-card">
      {/* <Image src={imageSrc} alt={pokemon.name} width={96} height={96} /> */}
      <img src={imageSrc} alt={pokemon.name} width={96} height={96} />
      <h2>{pokemon.name}</h2>
      <p>
        HP: {currentHp} / {pokemon.base_experience}
      </p>
      {/* ... other properties of pokemon */}
    </div>
  );
};

export default PokemonCard;
