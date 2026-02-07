# Repository Guidelines

## Project Structure & Module Organization
- App code lives in `src/`.
- Route pages and API endpoints use the Pages Router in `src/pages/` (for example, `src/pages/index.tsx`, `src/pages/api/getPokemon.ts`).
- Shared domain types are in `src/models/` grouped by feature (`Pokemon/`, `Game/`, `Item/`, etc.).
- Global state is in `src/context/`.
- Styles are in `src/styles/` (`globals.css`, `pokemon.css`).
- Static assets are in `public/`.
- Build output (`.next/`) and dependencies (`node_modules/`) are generated and should not be edited manually.

## Build, Test, and Development Commands
- `yarn dev`: start local dev server at `http://localhost:3000`.
- `yarn build`: create a production build.
- `yarn start`: run the production server from the build output.
- `yarn lint`: run ESLint with Next.js core-web-vitals rules.

Use Yarn 1.x (`packageManager` is pinned in `package.json`).

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`/`.tsx`) with `strict: true` in `tsconfig.json`.
- Indentation: 2 spaces; keep imports grouped and remove unused symbols.
- Components and pages: `PascalCase` for React component files (for example, `PokemonCard.tsx`).
- Utilities/models: lowercase or kebab-case filenames as already used (for example, `egg-group.ts`, `pokemon.ts`).
- Prefer alias imports from `@/*` for `src` paths when practical.

## Testing Guidelines
- No dedicated test framework is configured yet.
- Minimum verification for changes:
  - Run `yarn lint`.
  - Run `yarn build` for production-safety checks.
  - Manually test changed UI/API routes in `yarn dev`.
- If you add tests, place them near the feature or in a `__tests__/` folder with `*.test.ts(x)` naming.

## Commit & Pull Request Guidelines
- Follow existing commit style: Conventional Commit prefixes like `feat:` and `fix:` with short, imperative summaries.
- Keep commits focused by concern (UI, API, refactor, etc.).
- PRs should include:
  - Clear description of behavior changes.
  - Linked issue/task when available.
  - Screenshots or short recordings for UI updates.
  - Notes on verification steps run (`yarn lint`, `yarn build`, manual checks).
