# Chess and Go — Design Spec

Two new games for the browser-games project: Chess and Go (9x9), each with local two-player and AI opponent modes.

## Architecture & File Structure

Both games follow established project patterns. AI logic is separated into its own file due to complexity.

```
src/games/chess/
  gameLogic.ts          — board state, move generation, validation, check/checkmate
  chessAi.ts            — minimax with alpha-beta pruning, evaluation function
  ChessGame.tsx          — main component: mode switcher, board, controls, sidebar
  ChessPreview.tsx       — preview card for home page
  gameLogic.test.ts      — unit tests for rules and move generation

src/games/go/
  gameLogic.ts          — board state, capture logic, ko rule, scoring
  goAi.ts               — Monte Carlo Tree Search implementation
  GoGame.tsx             — main component: mode switcher, board, controls, sidebar
  GoPreview.tsx          — preview card for home page
  gameLogic.test.ts      — unit tests for captures, ko, scoring
```

Both register in `src/games/registry.ts`. No external libraries — all game logic from scratch.

## Game Modes (both games)

- **Two players** — local same-device play, matching the Noughts & Crosses pattern
- **Vs computer** — AI opponent with difficulty selector (Easy / Medium / Hard)
- Mode switcher is a segmented control at the top, same as existing games

## Chess

### Board Representation

- 8x8 array, each cell is `{ type: PieceType, color: Color } | null`
- Piece types: King, Queen, Rook, Bishop, Knight, Pawn
- Colors: White, Black
- Standard starting position

### Move Generation

Each piece type has its own movement generator:
- Sliding pieces (Rook, Bishop, Queen) iterate along rays until blocked
- Knights jump, ignoring intervening pieces
- Pawns: single push, double push from starting rank, diagonal captures, en passant
- King: one square any direction + castling

### Special Rules

- **Castling** — requires king and rook unmoved, no pieces between, king doesn't pass through or land in check
- **En passant** — track last move's double pawn push, adjacent pawn can capture
- **Pawn promotion** — modal prompt when pawn reaches back rank, default Queen with other options
- **Check/checkmate/stalemate** — after each move, filter legal moves for opponent; checkmate if none and in check, stalemate if none and not in check

### Move Validation

Generate candidate moves per piece, then filter any that leave own king in check.

### Game End Conditions

- Checkmate — win
- Stalemate — draw
- Insufficient material (K vs K, K+B vs K, K+N vs K) — draw
- 50-move rule and threefold repetition deferred to future iteration

### AI: Alpha-Beta Minimax

- **Evaluation function:** material value (standard piece values: P=1, N=3, B=3, R=5, Q=9), piece-square tables for positional bonuses, king safety heuristic, mobility (legal move count)
- **Alpha-beta pruning** on minimax search tree
- **Difficulty levels control search depth:** Easy (depth 2), Medium (depth 4), Hard (depth 5)
- Runs on `setTimeout` to keep UI responsive, matching the Noughts & Crosses pattern

### Board Visual Style

Classic green: `#eeeed2` (light) / `#769656` (dark) squares. Unicode chess characters for pieces. Rank/file labels on edges.

## Go (9x9)

### Board Representation

- 9x9 grid, each intersection is `'black' | 'white' | null`
- Positions indexed by `[row, col]`

### Core Rules

- **Placing stones** — click empty intersection to place stone of current color
- **Liberties** — empty intersections orthogonally adjacent to a connected group
- **Capture** — after placing, check opponent's adjacent groups first (remove if zero liberties), then check own group
- **Suicide rule** — illegal to play a move that leaves your own group with zero liberties after resolving opponent captures
- **Ko rule** — illegal to recreate the exact board state from one turn ago
- **Passing** — either player may pass; two consecutive passes end the game

### Scoring (Chinese rules — area scoring)

- Score = own stones on board + empty intersections fully surrounded by own stones
- **Komi:** White receives 6.5 points for going second (no ties)
- Territory highlighted on board at game end

### Game End

- Two consecutive passes trigger scoring
- Resign button available at any time

### AI: Monte Carlo Tree Search (MCTS)

Four-phase loop:
1. **Selection** — traverse tree using UCB1 (Upper Confidence Bound) to balance exploration vs exploitation
2. **Expansion** — add child node for an untried legal move
3. **Simulation (rollout)** — play random legal moves to game end, respecting capture and ko
4. **Backpropagation** — update win/loss stats up the tree

**Difficulty levels control simulation count:** Easy (~200), Medium (~800), Hard (~2000).

Runs on `setTimeout`. Hard mode may chunk simulations across frames to avoid blocking.

### Board Visual Style

Traditional wood: `#dcb35c` background, dark grid lines, star points (hoshi) at standard 9x9 positions. Black stones `#111`, white stones `#eee` with subtle border. SVG-based rendering.

## Shared UI Patterns

Both games use the same layout as Noughts & Crosses:

- **Layout:** Main area (score grid + status panel + board + action row), sidebar with rules and tips
- **Mode switcher:** Segmented control — "Two players" / "Vs computer"
- **Difficulty selector:** Appears in computer mode — Easy / Medium / Hard pills
- **Score tracking:** Win/loss/draw persisted via `useLocalStorage`
- **Status panel:** Current turn, check warnings, "AI is thinking..."
- **Action row:** "New game" and "Reset scores" buttons
- **Chess-specific:** Captured pieces display, selected piece highlighting, legal move dots, promotion modal
- **Go-specific:** Captured stones count, pass button, territory overlay during scoring, last-move indicator dot

## Testing

Using vitest, matching existing `gameLogic.test.ts` pattern.

### Chess Tests

- Move generation per piece type from known positions
- Castling legality (both sides, blocked, through check)
- En passant capture
- Pawn promotion
- Check detection
- Checkmate vs stalemate from known positions
- Pinned piece restrictions

### Go Tests

- Liberty counting for various group shapes
- Single stone and group capture
- Multi-group capture in one move
- Ko rule enforcement
- Suicide rule (illegal and legal-via-capture cases)
- Area scoring with komi

### Not Tested

- AI quality (non-deterministic)
- UI interactions (no component test pattern in the project)
