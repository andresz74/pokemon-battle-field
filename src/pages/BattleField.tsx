import React, { Fragment, useState, useEffect } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import PokemonCard from "./PokemonCard"; // make sure to import the PokemonCard component
import { Pokemon, PokemonMove } from "../models";

const BattleField: React.FC = () => {
  const [pokemon1, setPokemon1] = useState<Pokemon | null>(null);
  const [pokemon2, setPokemon2] = useState<Pokemon | null>(null);
  const [pokemon1CurrentHp, setPokemon1CurrentHp] = useState<number | null>(
    null
  );
  const [pokemon2CurrentHp, setPokemon2CurrentHp] = useState<number | null>(
    null
  );
  const [error, setError] = useState<boolean | null>(null);
  const [pokemon1Turn, setPokemon1Turn] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [pokemon1Moves, setPokemon1Moves] = useState<PokemonMove[]>([]);
  const [pokemon2Moves, setPokemon2Moves] = useState<PokemonMove[]>([]);
  const [selectedMove1, setSelectedMove1] = useState<PokemonMove | null>(null);
  const [selectedMove2, setSelectedMove2] = useState<PokemonMove | null>(null);
  const calculateDamage = (move: PokemonMove) => {
    // For simplicity, use the first version_group_detail's level_learned_at
    const level = move.version_group_details[0]?.level_learned_at;

    // If no level is specified, return a default damage value
    return level ? level : 1;
  };

  const user = {
    name: "Tom Cook",
    email: "tom@example.com",
    imageUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  };
  const navigation = [
    { name: "Battle Field", href: "#", current: true },
    // { name: "Team", href: "#", current: false },
    // { name: "Projects", href: "#", current: false },
    // { name: "Calendar", href: "#", current: false },
    // { name: "Reports", href: "#", current: false },
  ];
  //   const userNavigation = [
  //     { name: "Your Profile", href: "#" },
  //     { name: "Settings", href: "#" },
  //     { name: "Sign out", href: "#" },
  //   ];
  function classNames(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
  }

  const handleTurn = () => {
    if (pokemon1Turn) {
      if (!selectedMove1 || pokemon2CurrentHp === null) return;

      const damage = calculateDamage(selectedMove1);
      const newHp =
        pokemon2CurrentHp - damage <= 0 ? 0 : pokemon2CurrentHp - damage;
      setPokemon2CurrentHp(newHp);
    } else {
      if (!selectedMove2 || pokemon1CurrentHp === null) return;

      const damage = calculateDamage(selectedMove2);
      const newHp =
        pokemon1CurrentHp - damage <= 0 ? 0 : pokemon1CurrentHp - damage;
      setPokemon1CurrentHp(newHp);
    }

    if (pokemon1CurrentHp === 0 || pokemon2CurrentHp === 0) {
      setGameOver(true);
    } else {
      setPokemon1Turn(!pokemon1Turn);
    }
  };

  const fetchPokemonData = async () => {
    const pokemon1Name = '1';
    const pokemon2Name = '2';
    try {
      const res1 = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${pokemon1Name}`
      );
      const data1: Pokemon = res1.data;
      setPokemon1(data1);
      setPokemon1CurrentHp(
        data1.stats.find((stat) => stat.stat.name === "hp")?.base_stat || null
      );
      setPokemon1Moves(data1.moves);

      const res2 = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${pokemon2Name}`
      );
      const data2: Pokemon = res2.data;
      setPokemon2(data2);
      setPokemon2CurrentHp(
        data2.stats.find((stat) => stat.stat.name === "hp")?.base_stat || null
      );
      setPokemon2Moves(data2.moves);
    } catch (error) {
      console.error("Failed to fetch Pokemon data: ", error);
    }
  };

  useEffect(() => {
    fetchPokemonData();
  }, []);

  // Display error message if there's an error
  if (error) {
    return <div>Error: {error}</div>;
  }

  if (
    !pokemon1 ||
    !pokemon2 ||
    pokemon1CurrentHp === null ||
    pokemon2CurrentHp === null
  ) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-full">
      <Disclosure as="nav" className="bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {/* <img
                      className="h-8 w-8"
                      src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                      alt="Your Company"
                    /> */}
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white",
                            "rounded-md px-3 py-2 text-sm font-medium"
                          )}
                          aria-current={item.current ? "page" : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Disclosure>

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Battle Field
          </h1>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="battle-field">
            <PokemonCard pokemon={pokemon1} currentHp={pokemon1CurrentHp} />
            <select
              onChange={(e) =>
                setSelectedMove1(pokemon1Moves[parseInt(e.target.value)])
              }
            >
              {pokemon1Moves.map((move, index) => (
                <option key={index} value={index}>
                  {move.move.name}
                </option>
              ))}
            </select>

            {gameOver ? (
              <h2>
                Game Over!{" "}
                {pokemon1CurrentHp > pokemon2CurrentHp
                  ? pokemon1.name
                  : pokemon2.name}{" "}
                wins!
              </h2>
            ) : (
              <button
                type="button"
                onClick={handleTurn}
                className="lg:mx-4 group font-medium tracking-wide select-none text-base relative inline-flex items-center justify-center cursor-pointer h-12 border-2 border-solid py-0 px-6 rounded-md overflow-hidden z-10 outline-0 bg-blue-500 text-white border-blue-500"
              >
                Fight!
              </button>
            )}
            <select
              onChange={(e) =>
                setSelectedMove2(pokemon2Moves[parseInt(e.target.value)])
              }
            >
              {pokemon2Moves.map((move, index) => (
                <option key={index} value={index}>
                  {move.move.name}
                </option>
              ))}
            </select>

            <PokemonCard pokemon={pokemon2} currentHp={pokemon2CurrentHp} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BattleField;
