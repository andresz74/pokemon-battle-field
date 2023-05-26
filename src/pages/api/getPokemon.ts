import axios from "axios";
import { Pokemon } from "../../models";

export const getPokemon = async (selectedPokemonUrl: string): Promise<Pokemon> => {
  const res = await axios.get(selectedPokemonUrl);
  return res.data;
};
