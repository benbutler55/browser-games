# Game Roadmap

This document tracks the next round of improvements for the current game lineup. Planning lives here so the web UI can stay focused on launching and playing games.

## Pong

1. Add touch controls for mobile play.
2. Add local two-player mode.
3. Add match settings for target score and ball speed.
4. Add lightweight sound effects with a mute toggle.
5. Improve rally feedback with serve countdowns and point transitions.

## Minesweeper

1. Add custom board sizes and mine counts.
2. Add chord / quick-reveal behavior when adjacent flags match a revealed number.
3. Track richer local stats such as wins, losses, and streaks.
4. Improve touch interactions, including a clearer reveal/flag flow.
5. Add more logic-level test coverage around generation, reveal, and win conditions.

## Noughts and Crosses

1. Add AI difficulty levels beyond perfect play.
2. Add keyboard navigation for the board.
3. Add match-series options such as best-of rounds.
4. Add move highlights and win-line animation polish.
5. Consider small presentation or theme variations without changing the core rules.

## Solitaire

1. Add undo.
2. Add hints.
3. Add draw-three mode.
4. Improve target affordances for valid tableau and foundation moves.
5. Consider drag-and-drop only after the click-to-move model remains solid.
6. Add persistence for in-progress games if it improves the experience.

## Shared Improvements

1. Keep the live UI gameplay-first and move planning content into repo docs.
2. Standardize compact in-game controls, restart actions, and help affordances.
3. Improve mobile spacing and viewport usage across all game pages.
4. Expand logic-level tests across the game folders.
5. Consider a shared local preferences layer for settings such as sound and defaults.
