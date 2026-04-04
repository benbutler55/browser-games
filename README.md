# Browser Games

Browser Games is a static web app for hosting a growing collection of polished, browser-playable games. The project is designed to work well in local development and deploy cleanly to GitHub Pages without any backend.

## Repo summary

- Purpose: host a multi-game browser experience with a shared shell and room for future expansion.
- Stack: `Vite`, `React`, `TypeScript`, `react-router-dom`.
- Deployment model: fully static, GitHub Pages-friendly.
- UI direction: clean light interface with simple navigation and dedicated game routes.

## Current status

The repo now contains the shared application foundation plus the first playable game:

- shared app shell and navigation
- game registry for future expansion
- home page with implementation roadmap
- a fully playable `Noughts and Crosses` game with local multiplayer and computer mode
- per-game overview pages for the remaining planned lineup
- responsive styling and static-hosting-safe routing
- GitHub Pages deployment workflow in `.github/workflows/deploy.yml`

## Initial game lineup

- Pong
- Minesweeper
- Noughts and Crosses
- Solitaire (`Klondike draw-one`)

## Project structure

```text
src/
  app/
    pages/        # top-level route screens
    shell/        # shared app chrome and navigation
    router.tsx    # application router
  components/     # reusable UI building blocks
  games/
    minesweeper/  # game-specific modules
    noughts-and-crosses/
    pong/
    solitaire/
    registry.ts   # metadata-driven game registration
    types.ts      # shared game contracts
```

## Architecture notes

- New games should be added via `src/games/registry.ts` so the shell can discover them automatically.
- The app uses `HashRouter` to avoid rewrite issues on GitHub Pages.
- `vite.config.ts` uses `base: './'` so built assets stay relative.
- Shared layout and reusable UI live outside individual game folders to keep future growth manageable.

## Roadmap

### Phase 1 - Foundation

1. Initialize the repo and scaffold the static frontend.
2. Build the shared shell, routes, and registry pattern.
3. Establish the visual system and responsive layout.
4. Keep deployment GitHub Pages-ready from the start.

### Phase 2 - First playable games

1. Implement Minesweeper with difficulty presets and first-click safety.
2. Reuse the Noughts and Crosses board, score, and status patterns where useful.
3. Add shared restart, status, and settings patterns across games.

### Phase 3 - Realtime systems

1. Implement Pong with animation, collision logic, scoring, and AI.
2. Add keyboard-first controls and responsive game scaling.
3. Refine pause and reset flows.

### Phase 4 - Rich interaction

1. Implement Solitaire as `Klondike draw-one`.
2. Add move validation helpers and robust state transitions.
3. Layer in click-to-move first, then richer interaction patterns.

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

## Deployment

This project is intended to be pushed to GitHub and served via GitHub Pages as a static site. No server-side runtime is required.

- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Deployment target: GitHub Pages
- Trigger: push to `main` or manual workflow dispatch

If Pages is not already configured in the repository settings, set the site source to `GitHub Actions`.
