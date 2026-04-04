# Browser Games

Browser Games is a static web app for hosting a growing collection of polished, browser-playable games. The project is designed to work well in local development and deploy cleanly to GitHub Pages without any backend.

## Repo summary

- Purpose: host a multi-game browser experience with a shared shell and room for future expansion.
- Stack: `Vite`, `React`, `TypeScript`, `react-router-dom`.
- Deployment model: fully static, GitHub Pages-friendly.
- UI direction: clean light interface with simple navigation and dedicated game routes.

## Current status

The repo now contains the shared application foundation plus all four initial playable games:

- shared app shell and navigation
- game registry for future expansion
- gameplay-first home page that links directly into the games
- a fully playable `Pong` game with keyboard controls, AI difficulty levels, pause flow, and scoring
- a fully playable `Noughts and Crosses` game with local multiplayer and computer mode
- a fully playable `Minesweeper` game with preset and custom boards, chord reveal, timer tracking, and local stats
- a fully playable `Solitaire` game with Klondike draw-one rules and click-to-move interactions
- responsive styling and static-hosting-safe routing
- CI and GitHub Pages deployment workflows in `.github/workflows/`

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

## Next Improvements

- Detailed next-round planning now lives in `docs/game-roadmap.md`.
- The live site is kept gameplay-focused rather than showing architecture or roadmap panels.

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

## Continuous integration

- CI workflow: `.github/workflows/ci.yml`
- Validation steps: `npm run lint` and `npm run build`
- Runtime note: workflows explicitly opt into the Node 24 JavaScript actions runtime to avoid the GitHub deprecation path for Node 20-based actions.

If Pages is not already configured in the repository settings, set the site source to `GitHub Actions`.
