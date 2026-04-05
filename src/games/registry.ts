import { MinesweeperGame } from './minesweeper/MinesweeperGame'
import { MinesweeperPreview } from './minesweeper/MinesweeperPreview'
import { NoughtsAndCrossesGame } from './noughts-and-crosses/NoughtsAndCrossesGame'
import { NoughtsAndCrossesPreview } from './noughts-and-crosses/NoughtsAndCrossesPreview'
import { PongGame } from './pong/PongGame'
import { PongPreview } from './pong/PongPreview'
import { SolitaireGame } from './solitaire/SolitaireGame'
import { SolitairePreview } from './solitaire/SolitairePreview'
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
]

export function getGameBySlug(slug: string) {
  return games.find((game) => game.slug === slug)
}
