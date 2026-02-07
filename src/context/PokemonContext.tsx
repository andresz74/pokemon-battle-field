import React, { createContext, useContext, useEffect, useState } from "react";
import { PokemonListItem } from "../models";
import { fetchPokemonList } from "@/services/pokemonService";

interface PokemonContextProps {
  pokemonList: PokemonListItem[];
  loadingPokemonContext: boolean;
  errorPokemonContext: string | null;
}

const PokemonContext = createContext<PokemonContextProps | undefined>(
  undefined
);

export const usePokemonContext = () => {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error("usePokemonContext must be used within a PokemonProvider");
  }
  return context;
};

export const PokemonProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [loadingPokemonContext, setLoadingPokemonContext] =
    useState<boolean>(true);
  const [errorPokemonContext, setErrorPokemonContext] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchList = async () => {
      try {
        const list = await fetchPokemonList();
        setPokemonList(list);
      } catch {
        setErrorPokemonContext("Failed to fetch Pokemon list");
      } finally {
        setLoadingPokemonContext(false);
      }
    };

    fetchList();
  }, []);

  return (
    <PokemonContext.Provider
      value={{ pokemonList, loadingPokemonContext, errorPokemonContext }}
    >
      {children}
    </PokemonContext.Provider>
  );
};
