import axios from "axios";
import { PokemonListItem } from "../../models";

export const getPokemonList = async (): Promise<PokemonListItem[]> => {
  const res = await axios.get("https://pokeapi.co/api/v2/pokemon?limit=1280");
  return res.data.results;
};
