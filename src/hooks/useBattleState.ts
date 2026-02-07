import { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { Pokemon, PokemonMove } from "@/models";
import {
  fetchMoveByUrl,
  fetchPokemonByUrl,
  fetchTypeByName,
} from "@/services/pokemonService";
import { applyTurn, getHpStat, isReadyToStartBattle } from "@/lib/battle";

function pickRandom<T>(arr: T[], count: number): T[] {
  return _.sampleSize(arr, count);
}

export const useBattleState = () => {
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
  const [pokemon2Hp, setPokemon2Hp] = useState<number | null>(null);
  const [player1PokemonCurrentHp, setPlayer1PokemonCurrentHp] = useState<
    number | null
  >(null);
  const [player2PokemonCurrentHp, setPlayer2PokemonCurrentHp] = useState<
    number | null
  >(null);
  const [selectedMove1, setSelectedMove1] = useState<PokemonMove | null>(null);
  const [selectedMove2, setSelectedMove2] = useState<PokemonMove | null>(null);
  const [currentTurn, setCurrentTurn] = useState<"pokemon1" | "pokemon2">(
    "pokemon1"
  );
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [battleStarted, setBattleStarted] = useState<boolean>(false);
  const [resolvingTurn, setResolvingTurn] = useState<boolean>(false);
  const [battleMessage, setBattleMessage] = useState<string>(
    "Choose two pokemon and start the battle."
  );
  const [error, setError] = useState<string | null>(null);
  const [roundOrderText, setRoundOrderText] = useState<string>(
    "Round order: Trainer One acts first on tie-break."
  );

  useEffect(() => {
    let cancelled = false;

    const fetchPokemon = async (url: string, player: "p1" | "p2") => {
      try {
        const pokemon = await fetchPokemonByUrl(url);
        if (cancelled) {
          return;
        }

        const randomMoves = pickRandom(pokemon.moves, 5);
        const hp = getHpStat(pokemon);

        if (player === "p1") {
          setPlayer1Pokemon(pokemon);
          setPlayer1PokemonMoves(randomMoves);
          setPokemon1Hp(hp);
          setPlayer1PokemonCurrentHp(hp);
          setSelectedMove1(null);
        } else {
          setPlayer2Pokemon(pokemon);
          setPlayer2PokemonMoves(randomMoves);
          setPokemon2Hp(hp);
          setPlayer2PokemonCurrentHp(hp);
          setSelectedMove2(null);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to fetch Pokemon data");
        }
      }
    };

    if (selectedPokemonUrl1) {
      fetchPokemon(selectedPokemonUrl1, "p1");
    }

    if (selectedPokemonUrl2) {
      fetchPokemon(selectedPokemonUrl2, "p2");
    }

    return () => {
      cancelled = true;
    };
  }, [selectedPokemonUrl1, selectedPokemonUrl2]);

  const canStartBattle = isReadyToStartBattle(player1Pokemon, player2Pokemon);
  const canFight = Boolean(
    battleStarted &&
      !gameOver &&
      !resolvingTurn &&
      player1Pokemon &&
      player2Pokemon &&
      selectedMove1 &&
      selectedMove2
  );

  const winnerName = useMemo(() => {
    if (!gameOver) {
      return null;
    }

    if (
      player1PokemonCurrentHp === null ||
      player2PokemonCurrentHp === null ||
      !player1Pokemon ||
      !player2Pokemon
    ) {
      return null;
    }

    return player1PokemonCurrentHp > player2PokemonCurrentHp
      ? player1Pokemon.name
      : player2Pokemon.name;
  }, [
    gameOver,
    player1Pokemon,
    player2Pokemon,
    player1PokemonCurrentHp,
    player2PokemonCurrentHp,
  ]);

  const handleTurn = async () => {
    if (resolvingTurn || !player1Pokemon || !player2Pokemon) {
      return;
    }

    setResolvingTurn(true);
    try {
      const result = await applyTurn({
        currentTurn,
        player1Pokemon,
        player2Pokemon,
        player1Hp: player1PokemonCurrentHp,
        player2Hp: player2PokemonCurrentHp,
        selectedMove1,
        selectedMove2,
        resolveMove: fetchMoveByUrl,
        resolveType: fetchTypeByName,
      });

      if (!result.applied) {
        setBattleMessage(result.message);
        return;
      }

      setPlayer1PokemonCurrentHp(result.player1Hp);
      setPlayer2PokemonCurrentHp(result.player2Hp);
      setCurrentTurn(result.currentTurn as "pokemon1" | "pokemon2");
      setGameOver(result.gameOver);
      setBattleMessage(result.message);
      setRoundOrderText(
        `Round order: ${
          result.currentTurn === "pokemon1" ? "Trainer One" : "Trainer Two"
        } acted first.`
      );
    } catch {
      setBattleMessage("Turn could not be resolved due to a network error.");
    } finally {
      setResolvingTurn(false);
    }
  };

  const handleRestart = () => {
    setPlayer1Pokemon(null);
    setSelectedPokemonUrl1(null);
    setPlayer1PokemonMoves([]);
    setPokemon1Hp(null);
    setPlayer1PokemonCurrentHp(null);
    setSelectedMove1(null);

    setPlayer2Pokemon(null);
    setSelectedPokemonUrl2(null);
    setPlayer2PokemonMoves([]);
    setPokemon2Hp(null);
    setPlayer2PokemonCurrentHp(null);
    setSelectedMove2(null);

    setBattleStarted(false);
    setGameOver(false);
    setCurrentTurn("pokemon1");
    setBattleMessage("Battle restarted. Choose both pokemon and moves again.");
    setRoundOrderText("Round order: Trainer One acts first on tie-break.");
  };

  const handleNewBattle = () => {
    setPlayer1Pokemon(null);
    setSelectedPokemonUrl1(null);
    setPlayer1PokemonMoves([]);
    setPokemon1Hp(null);
    setPlayer1PokemonCurrentHp(null);
    setSelectedMove1(null);

    setPlayer2Pokemon(null);
    setSelectedPokemonUrl2(null);
    setPlayer2PokemonMoves([]);
    setPokemon2Hp(null);
    setPlayer2PokemonCurrentHp(null);
    setSelectedMove2(null);

    setBattleStarted(false);
    setGameOver(false);
    setCurrentTurn("pokemon1");
    setResolvingTurn(false);
    setBattleMessage("Choose two pokemon and start the battle.");
    setRoundOrderText("Round order: Trainer One acts first on tie-break.");
    setError(null);
  };

  const startBattle = () => {
    if (!canStartBattle) {
      return;
    }

    setBattleStarted(true);
    setBattleMessage("Battle started. Select both moves, then fight.");
    setRoundOrderText("Round order: Trainer One acts first on tie-break.");
  };

  return {
    battleStarted,
    battleMessage,
    canStartBattle,
    canFight,
    currentTurn,
    error,
    gameOver,
    handleNewBattle,
    handleRestart,
    handleTurn,
    player1Pokemon,
    player1PokemonCurrentHp,
    player1PokemonMoves,
    player2Pokemon,
    player2PokemonCurrentHp,
    player2PokemonMoves,
    pokemon1Hp,
    pokemon2Hp,
    roundOrderText,
    resolvingTurn,
    setSelectedMove1,
    setSelectedMove2,
    setSelectedPokemonUrl1,
    setSelectedPokemonUrl2,
    startBattle,
    winnerName,
  };
};
