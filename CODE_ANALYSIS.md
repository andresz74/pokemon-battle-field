# Code Analysis Summary

## Scope
This analysis covers project structure, runtime flow, and code quality signals for the current Next.js app.

## High-Level Architecture
- Framework: Next.js `13.3.1` (Pages Router) + React `18` + TypeScript strict mode.
- Entry point renders the battle UI through `BattleField` (`src/pages/index.tsx:1`).
- Global app wrapper provides Pokémon list state with context (`src/pages/_app.tsx:1`, `src/context/PokemonContext.tsx:23`).
- Domain modeling is extensive and type-centric (`src/models/**`), with the largest file at `src/models/Pokemon/pokemon.ts` (807 lines).

## Runtime/Data Flow
1. `PokemonProvider` fetches the full Pokémon list from PokeAPI (`src/context/PokemonContext.tsx:38`).
2. `BattleField` consumes that list and allows each player to select a Pokémon (`src/pages/BattleField.tsx:16`).
3. On selection, details are fetched from the selected Pokémon URL (`src/pages/BattleField.tsx:156`).
4. Random move sets are sampled with Lodash `sampleSize` (`src/pages/BattleField.tsx:11`).
5. Turn resolution subtracts damage based on `level_learned_at` from selected move metadata (`src/pages/BattleField.tsx:48`, `src/pages/BattleField.tsx:78`).

## Build and Lint Results
- `yarn lint`: passes with 1 warning.
  - Warning: `@next/next/no-img-element` in `src/pages/PokemonCard.tsx:54`.
- `yarn build`: succeeds.
  - Same warning repeated.
  - Build output includes routes for `/api/getPokemon` and `/api/getPokemonList`.

## Key Findings
- `src/pages/BattleField.tsx` is large (352 lines) and mixes UI rendering, battle logic, and data-fetching state. This reduces maintainability.
- Utility fetchers are placed under `src/pages/api/` but implemented as exported functions, not API route handlers (`src/pages/api/getPokemon.ts:4`, `src/pages/api/getPokemonList.ts:4`).
  - This causes an ambiguous boundary between server API routes and client-side data services.
- `handleTurn` checks game-over conditions using pre-update state in the same event cycle (`src/pages/BattleField.tsx:99`), which can lead to edge-case timing issues.
- Debug-only variables/logs remain in production paths (`user` object and `console.log`) (`src/pages/BattleField.tsx:56`, `src/pages/BattleField.tsx:200`, `src/context/PokemonContext.tsx:35`).
- `PokemonCard` uses array index as key in selects (`src/pages/PokemonCard.tsx:49`, `src/pages/PokemonCard.tsx:62`), which is stable enough for static lists but not ideal if ordering changes.

## Suggested Improvements (Priority Order)
1. Move data-fetch helpers out of `src/pages/api/` into `src/services/` (or similar) to separate client services from route handlers.
2. Split `BattleField` into focused hooks/components (`useBattleState`, `BattleControls`, `BattleStatus`) for testability and readability.
3. Replace `<img>` with `next/image` in `PokemonCard` to resolve lint warning and improve loading behavior.
4. Remove debug logging and dead/commented code paths.
5. Add a test setup (unit tests for battle turn resolution + integration checks for selection flow).

## Code Debt Backlog
1. Refactor `src/pages/BattleField.tsx` into smaller units (hook + presentational components) to reduce complexity and improve maintainability.
2. Relocate fetch utilities from `src/pages/api/` to a dedicated client service layer (for example, `src/services/`) to avoid route/service boundary confusion.
3. Replace `<img>` in `src/pages/PokemonCard.tsx` with `next/image` to satisfy Next.js lint guidance and improve asset optimization.
4. Rework turn resolution in `handleTurn` (`src/pages/BattleField.tsx`) so game-over logic uses guaranteed current HP values, not potentially stale state.
5. Remove debug artifacts (`console.log`, unused `user` object, commented blocks) from runtime paths.
6. Replace list index keys in `PokemonCard` selects with stable keys (`p.name`, `move.move.name`) to reduce rendering fragility.
7. Add automated tests (unit tests for damage/turn rules and integration tests for selection/start/fight flows) to prevent regressions.
