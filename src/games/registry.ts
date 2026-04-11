import { ChessGame } from './chess/ChessGame'
import { ChessPreview } from './chess/ChessPreview'
import { MinesweeperGame } from './minesweeper/MinesweeperGame'
import { MinesweeperPreview } from './minesweeper/MinesweeperPreview'
import { NoughtsAndCrossesGame } from './noughts-and-crosses/NoughtsAndCrossesGame'
import { NoughtsAndCrossesPreview } from './noughts-and-crosses/NoughtsAndCrossesPreview'
import { PongGame } from './pong/PongGame'
import { PongPreview } from './pong/PongPreview'
import { SolitaireGame } from './solitaire/SolitaireGame'
import { SolitairePreview } from './solitaire/SolitairePreview'
import { SnakeGame } from './snake/SnakeGame'
import { SnakePreview } from './snake/SnakePreview'
import { SudokuGame } from './sudoku/SudokuGame'
import { SudokuPreview } from './sudoku/SudokuPreview'
import { TwentyFortyEightGame } from './twenty-forty-eight/TwentyFortyEightGame'
import { TwentyFortyEightPreview } from './twenty-forty-eight/TwentyFortyEightPreview'
import { TetrisGame } from './tetris/TetrisGame'
import { TetrisPreview } from './tetris/TetrisPreview'
import { WordleGame } from './wordle/WordleGame'
import { WordlePreview } from './wordle/WordlePreview'
import type { GameDefinition } from './types'

export const games: GameDefinition[] = [
  {
    slug: 'pong',
    name: 'Pong',
    genre: 'Arcade',
    status: 'Playable',
    description:
      'A responsive paddle game with keyboard controls, a paced AI opponent, and a clean single-screen layout.',
    tags: ['Realtime', 'Keyboard', 'Canvas-friendly'],
    highlights: [
      'Single-player vs AI and local two-player are both live.',
      'Match settings now cover difficulty, target score, and overall pace.',
      'Touch controls are available for mobile-friendly play.',
    ],
    controls: 'Keyboard and touch controls are both supported.',
    initialMode: 'One-player vs AI or local two-player, with adjustable match settings.',
    expansionPath: 'Sound design, richer match modifiers, and presentation polish.',
    preview: PongPreview,
    playable: PongGame,
  },
  {
    slug: 'minesweeper',
    name: 'Minesweeper',
    genre: 'Puzzle',
    status: 'Playable',
    description:
      'A modern take on the classic deduction puzzle with preset boards, timer tracking, and first-click safety.',
    tags: ['Grid logic', 'Persistence', 'Difficulty presets'],
    highlights: [
      'Beginner, intermediate, and expert board sizes.',
      'First click is always safe and opens space cleanly.',
      'State model now supports difficulty persistence and best-time history.',
    ],
    controls: 'Mouse or touch for reveal and flag actions.',
    initialMode: 'Classic single-board play with three preset difficulty levels.',
    expansionPath: 'Custom boards, stat history, hints, and accessibility helpers.',
    preview: MinesweeperPreview,
    playable: MinesweeperGame,
  },
  {
    slug: 'noughts-and-crosses',
    name: 'Noughts and Crosses',
    genre: 'Strategy',
    status: 'Playable',
    description:
      'The fastest route to proving the game architecture: compact rules, clear end states, and reusable UI patterns.',
    tags: ['Turn-based', 'Local multiplayer', 'AI-ready'],
    highlights: [
      'First build target for validating shared game-shell patterns.',
      'Includes local two-player play and an unbeatable computer mode.',
      'Uses reusable board, score, and round-status patterns that later games can borrow.',
    ],
    controls: 'Click or tap a square to place a mark.',
    initialMode: 'Two-player local play or a one-player mode against the computer.',
    expansionPath: 'Simple AI, score streaks, board themes, and keyboard navigation.',
    preview: NoughtsAndCrossesPreview,
    playable: NoughtsAndCrossesGame,
  },
  {
    slug: 'solitaire',
    name: 'Solitaire',
    genre: 'Card game',
    status: 'Playable',
    description:
      'Klondike draw-three with approachable card movement, clear pile states, and room for richer interaction later.',
    tags: ['Card logic', 'Drag and drop', 'State validation'],
    highlights: [
      'Klondike draw-three is now live with stock, waste, foundations, and tableau rules.',
      'Move validation lives in pure logic helpers where possible.',
      'Cards can be moved with click-to-move or drag-and-drop interactions.',
    ],
    controls: 'Click-to-move first, drag support layered in with care.',
    initialMode: 'Classic Klondike draw-three with stock, waste, foundations, and tableau.',
    expansionPath: 'Undo, hints, scoring, and themed decks.',
    preview: SolitairePreview,
    playable: SolitaireGame,
  },
  {
    slug: 'twenty-forty-eight',
    name: '2048',
    genre: 'Puzzle',
    status: 'Playable',
    description:
      'Slide tiles on a 4x4 grid to merge matching numbers. Reach the 2048 tile to win, with undo and swipe support.',
    tags: ['Swipe', 'Undo', 'High score'],
    highlights: [
      'Arrow keys and swipe gestures for mobile.',
      'Undo support with up to 20 moves of history.',
      'Best score and best tile tracking.',
    ],
    controls: 'Arrow keys or swipe on mobile.',
    initialMode: 'Classic 4x4 board with score tracking.',
    expansionPath: 'Animations, tile themes, and board size options.',
    preview: TwentyFortyEightPreview,
    playable: TwentyFortyEightGame,
  },
  {
    slug: 'snake',
    name: 'Snake',
    genre: 'Arcade',
    status: 'Playable',
    description:
      'Guide a growing snake to collect food on a 20x20 grid. Arrow keys, WASD, and swipe gestures supported.',
    tags: ['Realtime', 'Swipe', 'High score'],
    highlights: [
      'Arrow keys and WASD for desktop, swipe gestures for mobile.',
      'Direction input queue prevents missed rapid inputs.',
      'High score tracking with localStorage persistence.',
    ],
    controls: 'Arrow keys, WASD, or swipe. Space to pause.',
    initialMode: 'Classic snake on a 20x20 grid.',
    expansionPath: 'Speed levels, obstacles, and wrap-around mode.',
    preview: SnakePreview,
    playable: SnakeGame,
  },
  {
    slug: 'wordle',
    name: 'Wordle',
    genre: 'Word',
    status: 'Playable',
    description:
      'Guess the daily five-letter word in six tries with color-coded feedback for each letter.',
    tags: ['Daily puzzle', 'Keyboard', 'Word game'],
    highlights: [
      'Daily word seeded by date for consistent play.',
      'On-screen virtual keyboard with letter state tracking.',
      'Game state and win/loss stats persisted in localStorage.',
    ],
    controls: 'Type letters, Enter to submit, Backspace to delete. On-screen keyboard also available.',
    initialMode: 'Daily word puzzle with six attempts.',
    expansionPath: 'Hard mode, streak tracking, share results, and extended word list.',
    preview: WordlePreview,
    playable: WordleGame,
  },
  {
    slug: 'tetris',
    name: 'Tetris',
    genre: 'Arcade',
    status: 'Playable',
    description:
      'Classic block-stacking game with seven piece types, rotation, ghost piece preview, and level progression.',
    tags: ['Realtime', 'Keyboard', 'High score'],
    highlights: [
      'Seven piece types with four rotation states and wall kicks.',
      'Ghost piece shows landing position.',
      'Level progression speeds up the drop rate.',
    ],
    controls: 'Arrow keys to move and rotate, X to hard drop, Space to pause.',
    initialMode: 'Classic Tetris with score, lines, and level tracking.',
    expansionPath: 'Hold piece, T-spin detection, and multiplayer.',
    preview: TetrisPreview,
    playable: TetrisGame,
  },
  {
    slug: 'sudoku',
    name: 'Sudoku',
    genre: 'Puzzle',
    status: 'Playable',
    description:
      'Classic number-placement puzzle with backtracking generator, pencil marks, and three difficulty levels.',
    tags: ['Grid logic', 'Keyboard', 'Persistence'],
    highlights: [
      'Backtracking puzzle generator with easy, medium, and hard presets.',
      'Pencil mark mode for tracking candidate numbers.',
      'Conflict highlighting shows invalid placements instantly.',
    ],
    controls: 'Click to select, number keys to fill, arrow keys to navigate. Backspace to clear.',
    initialMode: 'Classic 9x9 Sudoku with difficulty selection.',
    expansionPath: 'Hints, undo support, and puzzle rating.',
    preview: SudokuPreview,
    playable: SudokuGame,
  },
  {
    slug: 'chess',
    name: 'Chess',
    genre: 'Strategy',
    status: 'Playable',
    description:
      'Full chess with castling, en passant, promotion, and checkmate detection. Three AI difficulty levels powered by alpha-beta pruning.',
    tags: ['Turn-based', 'AI opponent', 'Strategy'],
    highlights: [
      'Complete chess rules including castling, en passant, and pawn promotion.',
      'Three AI difficulty levels using alpha-beta search with piece-square tables.',
      'Local two-player and vs computer modes with score tracking.',
    ],
    controls: 'Click to select a piece, then click a highlighted square to move.',
    initialMode: 'Two-player local play or vs computer with adjustable difficulty.',
    expansionPath: 'Move history notation, undo, opening book, and timed matches.',
    preview: ChessPreview,
    playable: ChessGame,
  },
]

export function getGameBySlug(slug: string) {
  return games.find((game) => game.slug === slug)
}
