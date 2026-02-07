import { Move, Pokemon, PokemonListItem, Type } from "@/models";

const POKEMON_LIST_URL = "https://pokeapi.co/api/v2/pokemon?limit=1280";

const moveCache = new Map<string, Move>();
const typeCache = new Map<string, Type>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as T;
}

export const fetchPokemonList = async (): Promise<PokemonListItem[]> => {
  const data = await fetchJson<{ results: PokemonListItem[] }>(POKEMON_LIST_URL);
  return data.results;
};

export const fetchPokemonByUrl = async (url: string): Promise<Pokemon> => {
  return fetchJson<Pokemon>(url);
};

export const fetchMoveByUrl = async (url: string): Promise<Move> => {
  if (moveCache.has(url)) {
    return moveCache.get(url) as Move;
  }

  const move = await fetchJson<Move>(url);
  moveCache.set(url, move);
  return move;
};

export const fetchTypeByName = async (name: string): Promise<Type> => {
  const key = name.toLowerCase();
  if (typeCache.has(key)) {
    return typeCache.get(key) as Type;
  }

  const type = await fetchJson<Type>(`https://pokeapi.co/api/v2/type/${key}`);
  typeCache.set(key, type);
  return type;
};
