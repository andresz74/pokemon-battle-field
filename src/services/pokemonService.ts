import axios from "axios";
import { Move, Pokemon, PokemonListItem, Type } from "@/models";

const POKEMON_LIST_URL = "https://pokeapi.co/api/v2/pokemon?limit=1280";

const moveCache = new Map<string, Move>();
const typeCache = new Map<string, Type>();

export const fetchPokemonList = async (): Promise<PokemonListItem[]> => {
  const res = await axios.get(POKEMON_LIST_URL);
  return res.data.results;
};

export const fetchPokemonByUrl = async (url: string): Promise<Pokemon> => {
  const res = await axios.get(url);
  return res.data;
};

export const fetchMoveByUrl = async (url: string): Promise<Move> => {
  if (moveCache.has(url)) {
    return moveCache.get(url) as Move;
  }

  const res = await axios.get(url);
  moveCache.set(url, res.data);
  return res.data;
};

export const fetchTypeByName = async (name: string): Promise<Type> => {
  const key = name.toLowerCase();
  if (typeCache.has(key)) {
    return typeCache.get(key) as Type;
  }

  const res = await axios.get(`https://pokeapi.co/api/v2/type/${key}`);
  typeCache.set(key, res.data);
  return res.data;
};
