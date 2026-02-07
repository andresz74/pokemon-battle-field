import React, { useEffect, useMemo, useState } from "react";
import { PokemonListItem } from "@/models";

interface SearchablePokemonSelectProps {
  pokemonList: PokemonListItem[];
  selectedName?: string;
  disabled?: boolean;
  onSelectPokemon: (url: string) => void;
}

export const SearchablePokemonSelect: React.FC<SearchablePokemonSelectProps> = ({
  pokemonList,
  selectedName,
  disabled = false,
  onSelectPokemon,
}) => {
  const [query, setQuery] = useState(selectedName ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(selectedName ?? "");
  }, [selectedName]);

  const filteredPokemon = useMemo(() => {
    if (!query.trim()) {
      return pokemonList.slice(0, 80);
    }

    const normalized = query.toLowerCase().trim();
    return pokemonList
      .filter((pokemon) => pokemon.name.toLowerCase().includes(normalized))
      .slice(0, 80);
  }, [pokemonList, query]);

  const handleFocus = () => {
    if (disabled) {
      return;
    }
    setOpen(true);
    if (selectedName && query.toLowerCase() === selectedName.toLowerCase()) {
      setQuery("");
    }
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      setOpen(false);
      if (!query.trim() && selectedName) {
        setQuery(selectedName);
      }
    }, 120);
  };

  return (
    <div className="pokemon-combobox-wrap">
      <input
        className="battle-select pokemon-combobox-input"
        value={query}
        onChange={(event) => {
          if (disabled) {
            return;
          }
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="Search pokemon..."
        autoComplete="off"
      />

      {open && !disabled && (
        <div className="pokemon-combobox-options" role="listbox">
          {filteredPokemon.length === 0 ? (
            <div className="pokemon-combobox-empty">No pokemon found</div>
          ) : (
            filteredPokemon.map((pokemon) => (
              <button
                key={pokemon.name}
                type="button"
                className="pokemon-combobox-option"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelectPokemon(pokemon.url);
                  setQuery(pokemon.name);
                  setOpen(false);
                }}
              >
                {pokemon.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
