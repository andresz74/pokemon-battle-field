import React, { useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const displayValue = open ? query : selectedName ?? query;

  const filteredPokemon = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) {
      return pokemonList.slice(0, 80);
    }

    return pokemonList
      .filter((pokemon) => pokemon.name.toLowerCase().includes(normalized))
      .slice(0, 80);
  }, [pokemonList, query]);

  const handleFocus = () => {
    if (disabled) {
      return;
    }
    setOpen(true);
    if (selectedName && displayValue.toLowerCase() === selectedName.toLowerCase()) {
      setQuery("");
    }
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  return (
    <div className="pokemon-combobox-wrap">
      <input
        className="battle-select pokemon-combobox-input"
        value={displayValue}
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
