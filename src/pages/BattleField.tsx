import React, { Fragment, useState, useEffect } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import PokemonCard from "./PokemonCard"; // make sure to import the PokemonCard component
import { Pokemon, PokemonMove } from "../models";

const BattleField: React.FC = () => {
  const [pokemon1, setPokemon1] = useState<Pokemon | null>(null);
  const [pokemon2, setPokemon2] = useState<Pokemon | null>(null);
  const [pokemon1Hp, setPokemon1Hp] = useState<number | null>(null);
  const [pokemon1CurrentHp, setPokemon1CurrentHp] = useState<number | null>(
    null
  );
  const [pokemon2Hp, setPokemon2Hp] = useState<number | null>(null);
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
  const [currentTurn, setCurrentTurn] = useState<string>("pokemon1");
  const [battleStarted, setBattleStarted] = useState<boolean>(false);

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

    if (currentTurn === "pokemon1") {
      setCurrentTurn("pokemon2");
    } else {
      setCurrentTurn("pokemon1");
    }
  };

  const handleRestart = async () => {
    // reset the state
    if (pokemon1) {
      let pokemon1Hp = pokemon1.stats.filter(
        (stat) => stat.stat.name === "hp"
      )[0].base_stat;
      setPokemon1CurrentHp(pokemon1Hp);
    }

    if (pokemon2) {
      let pokemon2Hp = pokemon2.stats.filter(
        (stat) => stat.stat.name === "hp"
      )[0].base_stat;
      setPokemon1CurrentHp(pokemon2Hp);
    }

    setBattleStarted(false);
    setGameOver(false);
    setCurrentTurn("pokemon1");

    // fetch new random moves
    const newPokemon1Moves = await fetchPokemonMoves(pokemon1);
    const newPokemon2Moves = await fetchPokemonMoves(pokemon2);

    setPokemon1Moves(newPokemon1Moves);
    setPokemon2Moves(newPokemon2Moves);
    setSelectedMove1(newPokemon1Moves[0]);
    setSelectedMove2(newPokemon2Moves[0]);
  };

  const fetchPokemonData = async () => {
    const pokemon1Name = "1";
    const pokemon2Name = "2";
    try {
      const res1 = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${pokemon1Name}`
      );
      const data1: Pokemon = res1.data;
      setPokemon1(data1);
      setPokemon1Hp(
        data1.stats.find((stat) => stat.stat.name === "hp")?.base_stat || null
      );
      setPokemon1CurrentHp(
        data1.stats.find((stat) => stat.stat.name === "hp")?.base_stat || null
      );
      setPokemon1Moves(data1.moves);

      const res2 = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${pokemon2Name}`
      );
      const data2: Pokemon = res2.data;
      setPokemon2(data2);
      setPokemon2Hp(
        data2.stats.find((stat) => stat.stat.name === "hp")?.base_stat || null
      );
      setPokemon2CurrentHp(
        data2.stats.find((stat) => stat.stat.name === "hp")?.base_stat || null
      );
      setPokemon2Moves(data2.moves);
    } catch (error) {
      console.error("Failed to fetch Pokemon data: ", error);
    }
  };

  async function fetchPokemonMoves(
    pokemon: Pokemon | null
  ): Promise<PokemonMove[]> {
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${pokemon.id}`
      );
      const data = await response.json();

      // shuffle the moves array
      const shuffled = data.moves.sort(() => 0.5 - Math.random());

      // Get first 5 elements
      const selected = shuffled.slice(0, 5);

      return selected;
    } catch (error) {
      console.error("Failed to fetch Pokemon moves: ", error);
      return [];
    }
  }

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
          {battleStarted ? (
            <div className="battle-field">
              <button onClick={handleRestart}>Restart Battle</button>
              <PokemonCard
                pokemon={pokemon1}
                hp={pokemon1Hp}
                currentHp={pokemon1CurrentHp}
                moves={pokemon1Moves}
                setSelectedMove={setSelectedMove1}
                isTurn={currentTurn === "pokemon1"}
              />

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

              <PokemonCard
                pokemon={pokemon2}
                hp={pokemon2Hp}
                currentHp={pokemon2CurrentHp}
                moves={pokemon2Moves}
                setSelectedMove={setSelectedMove2}
                isTurn={currentTurn === "pokemon2"}
              />
            </div>
          ) : (
            // If the battle hasn't started, render a "Start Battle" button
            <button onClick={() => setBattleStarted(true)}>Start Battle</button>
          )}
        </div>
      </main>
    </div>
  );
};

export default BattleField;
