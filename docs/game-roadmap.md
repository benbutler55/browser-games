# Game Roadmap

This document tracks the next round of improvements for the current game lineup. Planning lives here so the web UI can stay focused on launching and playing games.

## Pong

1. Add lightweight sound effects with a mute toggle.
2. Improve rally feedback with serve countdowns and point transitions.
3. Add optional spin and speed modifiers that make advanced returns more expressive.
4. Add stronger presentation polish for local two-player sessions.
5. Add touch-specific layout tuning for smaller phones.

## Minesweeper

1. Improve touch interactions, including a clearer reveal/flag flow.
2. Add more logic-level test coverage around generation, reveal, chord actions, and win conditions.
3. Add visual error feedback for over-flagging or impossible board reads.
4. Add richer stats views such as per-difficulty splits and longest solve sessions.
5. Consider a lightweight hint system for stalled boards.

## Noughts and Crosses

1. Add AI difficulty levels beyond perfect play.
2. Add keyboard navigation for the board.
3. Add match-series options such as best-of rounds.
4. Add move highlights and win-line animation polish.
5. Consider small presentation or theme variations without changing the core rules.
6. Add a quick rematch flow that can preserve the current mode and score settings.

## Solitaire

1. Add undo.
2. Add hints.
3. Improve target affordances for valid tableau and foundation moves.
4. Add persistence for in-progress games if it improves the experience.
5. Add safe auto-foundation rules, animation polish, and better move-history feedback.
6. Continue polishing drag-and-drop behavior across desktop and touch devices.

## Shared Improvements

1. Keep the live UI gameplay-first and move planning content into repo docs.
2. Standardize compact in-game controls, restart actions, and help affordances.
3. Improve mobile spacing and viewport usage across all game pages.
4. Expand logic-level tests across the game folders.
5. Consider a shared local preferences layer for settings such as sound and defaults.

## Suggested Next Round

1. `Solitaire`: undo, hints, and draw-three support.
2. `Noughts and Crosses`: AI difficulty tiers and keyboard navigation.
3. `Minesweeper`: touch polish, deeper stats, and hint/error feedback.
4. `Pong`: sound, presentation polish, and advanced match modifiers.
