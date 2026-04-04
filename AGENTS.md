# Agent Notes

This repository hosts the source code for a browser-based games collection that runs locally and can be deployed as a static site to GitHub Pages.

## Goals

- Keep the app structured so new games can be added without reworking the shell.
- Maintain a clean, modern, light UI with simple navigation.
- Prefer shared framework pieces for routing, layout, and reusable controls.
- Keep the app static-hosting-friendly at all times.

## Current architecture

- `src/app/` contains routing, pages, and shared shell layout.
- `src/components/` contains reusable presentational pieces.
- `src/games/` contains one folder per game plus the central registry and shared types.
- `src/games/registry.ts` is the source of truth for what games appear in navigation and on the home page.

## Delivery plan

1. `Noughts and Crosses` is now the first playable game and should be treated as the reference implementation for turn-based game patterns.
2. `Minesweeper` is now the reference implementation for grid-state, timer, difficulty, and local persistence patterns.
3. `Pong` is now the reference implementation for animation, AI pacing, pause flow, and keyboard input.
4. `Solitaire` is now the reference implementation for card movement, pile validation, and richer interaction state.

## Working rules for future agents

- Keep `README.md` current whenever the repo structure, features, commands, or deployment story changes.
- Preserve GitHub Pages compatibility; prefer solutions that work on static hosting.
- Add new games through the registry pattern instead of hardcoding links in multiple places.
- Keep shared UI and shared logic outside individual game folders when it improves reuse.
- Run `npm run lint` and `npm run build` after meaningful code changes.
- Keep both GitHub workflows current and prefer Node 24-compatible actions/runtime settings.
- Ensure completed changes are committed and pushed to the remote repository without waiting for the user to ask.

## Current status

The repository currently provides the app shell, roadmap, navigation, CI and GitHub Pages workflows, and playable implementations of `Pong`, `Noughts and Crosses`, `Minesweeper`, and `Solitaire`.
