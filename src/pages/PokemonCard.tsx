import React, { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
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
  const [selectedPokemon, setCardSelectedPokemon] =
    useState<PokemonListItem | null>(null);
  const [selectedMove, setCardSelectedMove] = useState<PokemonMove | null>(
    null
  );
  const [query, setQuery] = useState("");

  const handlePokemonChange = (selectedPokemon: PokemonListItem | null) => {
    setCardSelectedPokemon(selectedPokemon);
    if (selectedPokemon) {
      setSelectedPokemon(selectedPokemon.url);
    } else {
      setSelectedPokemon("");
    }
  };

  const handleMoveChange = (selectedMove: PokemonMove | null) => {
    setCardSelectedMove(selectedMove);
    if (selectedMove) {
      setSelectedMove(selectedMove);
    }
  };

  const filteredPokemonList =
    query === ""
      ? pokemonList || []
      : (pokemonList || []).filter((pokemon) =>
          pokemon.name.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className={`pokemon-card ${isTurn ? "active" : ""}`}>
      <Combobox value={selectedPokemon} onChange={handlePokemonChange}>
        <div className={`relative mt-1`}>
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(pokemon: Pokemon) => (pokemon ? pokemon.name : "")}
              onChange={(event) => setQuery(event.target.value)}
            />

            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredPokemonList.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Nothing found.
                </div>
              ) : (
                filteredPokemonList.map((pokemon: PokemonListItem) => (
                  <Combobox.Option
                    key={pokemon.url}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-teal-600 text-white" : "text-gray-900"
                      }`
                    }
                    value={pokemon}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {pokemon.name}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-teal-600"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      {pokemon === null ? null : (
        <div>
          <img
            src={pokemon.sprites.front_default}
            alt={pokemon.name}
            width={96}
            height={96}
          />
          <h2>{pokemon.name}</h2>
          <p>
            HP: {currentHp} / {hp}
          </p>
          <Combobox
            value={selectedMove}
            onChange={handleMoveChange}
            disabled={!isTurn}
          >
            <div className="relative mt-1">
              <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                <Combobox.Input
                  className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                  displayValue={(move: PokemonMove) =>
                    move ? move.move.name : ""
                  }
                  onChange={(event) => setQuery(event.target.value)}
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </Combobox.Button>
              </div>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {moves.map((move, index) => (
                    <Combobox.Option
                      key={index}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-teal-600 text-white" : "text-gray-900"
                        }`
                      }
                      value={move}
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {move.move.name}
                          </span>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? "text-white" : "text-teal-600"
                              }`}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
      )}
    </div>
  );
};

export default PokemonCard;
