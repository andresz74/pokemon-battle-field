import React, { Fragment, useState, useEffect } from "react";
import _ from "lodash";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import PokemonCard from "./PokemonCard";
import { getPokemon, getPokemonList } from "../pages/api";
import { Pokemon, PokemonMove, PokemonListItem } from "../models";

function pickRandom<T>(arr: T[], count: number): T[] {
  return _.sampleSize(arr, count);
}

const BattleField: React.FC = () => {
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [player1Pokemon, setPlayer1Pokemon] = useState<Pokemon | null>(null);
  const [player2Pokemon, setPlayer2Pokemon] = useState<Pokemon | null>(null);
  const [selectedPokemonUrl1, setSelectedPokemonUrl1] = useState<string | null>(
    null
  );
  const [selectedPokemonUrl2, setSelectedPokemonUrl2] = useState<string | null>(
    null
  );
  const [player1PokemonMoves, setPlayer1PokemonMoves] = useState<PokemonMove[]>(
    []
  );
  const [player2PokemonMoves, setPlayer2PokemonMoves] = useState<PokemonMove[]>(
    []
  );
  const [pokemon1Hp, setPokemon1Hp] = useState<number | null>(null);
  const [player1PokemonCurrentHp, setPlayer1PokemonCurrentHp] = useState<
    number | null
  >(null);
  const [pokemon2Hp, setPokemon2Hp] = useState<number | null>(null);
  const [player2PokemonCurrentHp, setPlayer2PokemonCurrentHp] = useState<
    number | null
  >(null);
  const [error, setError] = useState<boolean | null>(null);
  const [pokemon1Turn, setPokemon1Turn] = useState<boolean>(true);
  const [gameOver, setGameOver] = useState<boolean>(false);
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
      if (!selectedMove1 || player2PokemonCurrentHp === null) return;

      const damage = calculateDamage(selectedMove1);
      const newHp =
      player2PokemonCurrentHp - damage <= 0 ? 0 : player2PokemonCurrentHp - damage;
      setPlayer2PokemonCurrentHp(newHp);
    } else {
      if (!selectedMove2 || player1PokemonCurrentHp === null) return;

      const damage = calculateDamage(selectedMove2);
      const newHp =
      player1PokemonCurrentHp - damage <= 0 ? 0 : player1PokemonCurrentHp - damage;
      setPlayer1PokemonCurrentHp(newHp);
    }

    if (player1PokemonCurrentHp === 0 || player2PokemonCurrentHp === 0) {
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
    if (player1Pokemon) {
      let pokemon1Hp = player1Pokemon.stats.filter(
        (stat) => stat.stat.name === "hp"
      )[0].base_stat;
      setPlayer1PokemonCurrentHp(pokemon1Hp);
    }

    if (player2Pokemon) {
      let pokemon2Hp = player2Pokemon.stats.filter(
        (stat) => stat.stat.name === "hp"
      )[0].base_stat;
      setPlayer2PokemonCurrentHp(pokemon2Hp);
    }

    setBattleStarted(false);
    setGameOver(false);
    setCurrentTurn("pokemon1");
  };

  // Fetch the list of Pokemon
  useEffect(() => {
    const fetchPokemonList = async () => {
      try {
        const list = await getPokemonList();
        setPokemonList(list);
      } catch (err) {
        console.error("Failed to fetch Pokemon list: ", error);
      }
    };

    fetchPokemonList();
  }, []);

  // Fetch Pokemon data
  useEffect(() => {
    const fetchPokemon = async () => {
      if (selectedPokemonUrl1) {
        const pokemon: Pokemon = await getPokemon(selectedPokemonUrl1);
        setPlayer1Pokemon(pokemon); // Set player 1's Pokemon
        const randomMoves = pickRandom(pokemon.moves, 5);
        setPlayer1PokemonMoves(randomMoves);
        // setSelectedMove1(randomMoves[0] || null);
        if (pokemon) {
          let pokemon1Hp = pokemon.stats.filter(
            (stat) => stat.stat.name === "hp"
          )[0].base_stat;
          setPokemon1Hp(pokemon1Hp);
          setPlayer1PokemonCurrentHp(pokemon1Hp);
        }
      }

      if (selectedPokemonUrl2) {
        const pokemon = await getPokemon(selectedPokemonUrl2);
        setPlayer2Pokemon(pokemon); // Set player 2's Pokemon
        const randomMoves = pickRandom(pokemon.moves, 5);
        setPlayer2PokemonMoves(randomMoves);
        // setSelectedMove2(randomMoves[0] || null);
        if (pokemon) {
          let pokemon2Hp = pokemon.stats.filter(
            (stat) => stat.stat.name === "hp"
          )[0].base_stat;
          setPokemon2Hp(pokemon2Hp);
          setPlayer2PokemonCurrentHp(pokemon2Hp);
        }
      }
    };

    fetchPokemon();
  }, [selectedPokemonUrl1, selectedPokemonUrl2]);

  const handlePokemonChange1 = (url: string) => {
    setSelectedPokemonUrl1(url);
    setSelectedMove1(null);
  };

  const handlePokemonChange2 = (url: string) => {
    setSelectedPokemonUrl2(url);
    setSelectedMove2(null);
  };

  // Display error message if there's an error
  if (error) {
    return <div>Error: {error}</div>;
  }

  // if (
  //   !player1Pokemon ||
  //   !player2Pokemon ||
  //   player1PokemonCurrentHp === null ||
  //   pokemon2CurrentHp === null
  // ) {
  //   return <div>Loading...</div>;
  // }

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
          <button
            type="button"
            onClick={handleRestart}
            className="lg:my-4 group font-medium tracking-wide select-none text-base relative inline-flex items-center justify-center cursor-pointer h-12 border-2 border-solid py-0 px-3 rounded-md overflow-hidden z-10 outline-0 bg-blue-500 text-white border-blue-500"
          >
            Restart Battle
          </button>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {battleStarted ? (
            <div className="battle-field">
              <PokemonCard
                pokemon={player1Pokemon}
                hp={pokemon1Hp}
                currentHp={player1PokemonCurrentHp}
                moves={player1PokemonMoves}
                setSelectedMove={setSelectedMove1}
                setSelectedPokemon={handlePokemonChange1}
                isTurn={currentTurn === "pokemon1"}
                pokemonList={pokemonList}
              />

              {gameOver ? (
                <h2>
                  Game Over!{" "}
                  {player1PokemonCurrentHp === null ||
                  player2PokemonCurrentHp === null
                    ? null
                    : player1PokemonCurrentHp > player2PokemonCurrentHp
                    ? player1Pokemon?.name
                    : player2Pokemon?.name}{" "}
                  wins!
                </h2>
              ) : (
                <button
                  type="button"
                  onClick={handleTurn}
                  className="lg:my-4 group font-medium tracking-wide select-none text-base relative inline-flex items-center justify-center cursor-pointer h-12 border-2 border-solid py-0 px-3 rounded-md overflow-hidden z-10 outline-0 bg-blue-500 text-white border-blue-500"
                >
                  Fight!
                </button>
              )}

              <PokemonCard
                pokemon={player2Pokemon}
                hp={pokemon2Hp}
                currentHp={player2PokemonCurrentHp}
                moves={player2PokemonMoves}
                setSelectedMove={setSelectedMove2}
                setSelectedPokemon={handlePokemonChange2}
                isTurn={currentTurn === "pokemon2"}
                pokemonList={pokemonList}
              />
            </div>
          ) : (
            // If the battle hasn't started, render a "Start Battle" button
            <button
              onClick={() => setBattleStarted(true)}
              className="lg:my-4 group font-medium tracking-wide select-none text-base relative inline-flex items-center justify-center cursor-pointer h-12 border-2 border-solid py-0 px-3 rounded-md overflow-hidden z-10 outline-0 bg-blue-500 text-white border-blue-500"
            >
              Start Battle
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default BattleField;
