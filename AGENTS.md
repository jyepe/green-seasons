# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Expo Router screens and layouts (tabs, auth, admin). Route files use kebab-case like `orders-by-day.tsx` and `+not-found.tsx`.
- `components/`: Reusable UI, organized by area (`components/admin`, `components/auth`, `components/employee`) with PascalCase filenames.
- `hooks/`: Custom hooks in `useX.ts` format.
- `reducers/`: Form reducers and UI state helpers.
- `lib/`: Integrations (Supabase) and shared utilities in `lib/utils/`.
- `constants/`, `config/`: Design tokens and environment helpers.
- `assets/`: Images and icons; `scripts/`: maintenance utilities.

## Build, Test, and Development Commands

- `npm install` - install dependencies.
- `npm start` - run the Expo dev server.
- `npm run android` / `npm run ios` / `npm run web` - launch platform targets.
- `npm run lint` / `npm run lint:fix` - run ESLint checks and auto-fixes.
- `npm run prettier:check` / `npm run prettier:fix` - formatting checks and fixes.
- `npm run typecheck` - TypeScript strict type check.
- `npm run check-all` - run typecheck, lint, and Prettier checks together.
- `npm run reset-project` - reset generated Expo state.

## CI & Release Tags

- Tags matching `dev-*` or `preview-*` (plus versioned `v*-dev*`, `v*-preview*`, `v*-rc*`) trigger EAS builds via GitHub Actions; tag intentionally.

## Coding Style & Naming Conventions

- TypeScript strict mode is enabled; prefer typed utilities and `@/*` path aliases.
- Prettier is the formatting source of truth: 2-space indentation, single quotes, semicolons, 80-column width.
- ESLint enforces `prefer-const`, disallows `var` and `debugger`, and warns on `console`.
- Naming: components `PascalCase.tsx`, hooks `useThing.ts`, reducers `camelCaseReducer.ts`, routes in `app/` use kebab-case.

## Testing Guidelines

- No dedicated test runner is configured yet (no Jest/Vitest scripts in `package.json`).
- Treat `npm run typecheck` and `npm run lint` as required verification.
- If you add tests, standardize on `*.test.ts(x)` or `__tests__/` and add matching npm scripts.

## Commit & Pull Request Guidelines

- Commit messages commonly use conventional prefixes (`feat:`, `chore:`, `refactor:`) or short imperative statements; follow that pattern.
- Keep commits focused and update UI assets with related code changes.
- PRs should include a summary, testing notes, and screenshots or recordings for UI updates.
- Link related issues and call out any new env vars or migrations.

## Security & Configuration Tips

- Configure Supabase via `.env` (or Expo config) with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Do not commit real keys; `app.json` contains placeholders for Expo/EAS builds.
