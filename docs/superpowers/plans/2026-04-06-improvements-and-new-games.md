# Browser Games: Improvements & New Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add infrastructure improvements (Vitest, CSS modules, shared hooks, dark mode, sound, keyboard shortcuts) and five new games (2048, Snake, Wordle, Tetris, Sudoku) to the browser-games collection.

**Architecture:** Each improvement is self-contained. Shared hooks live in `src/lib/`. New games follow the existing registry pattern with `gameLogic.ts` + `GameName.tsx` + preview. CSS modules co-locate styles with components. All game logic is pure functions, tested with Vitest.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest, CSS Modules, Web Audio API

---

## Phase 1: Infrastructure Improvements

### Task 1: Add Vitest and test existing game logic

**Files:**
- Modify: `package.json` (add vitest dev dependency)
- Modify: `vite.config.ts` (add test config)
- Create: `src/games/noughts-and-crosses/gameLogic.test.ts`
- Create: `src/games/minesweeper/gameLogic.test.ts`
- Create: `src/games/pong/gameLogic.test.ts`
- Create: `src/games/solitaire/gameLogic.test.ts`

- [ ] **Step 1: Install Vitest**

```bash
cd /home/ben/Github/personal/browser-games
npm install -D vitest
```

- [ ] **Step 2: Add test script to package.json**

Add to `scripts` in `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add test config to vite.config.ts**

Replace `vite.config.ts` with:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Write noughts-and-crosses tests**

Create `src/games/noughts-and-crosses/gameLogic.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  createEmptyBoard,
  getNextPlayer,
  calculateWinner,
  isBoardFull,
  getAvailableMoves,
  getBestMove,
} from './gameLogic'

describe('createEmptyBoard', () => {
  it('returns a 9-cell board of nulls', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(9)
    expect(board.every((cell) => cell === null)).toBe(true)
  })
})

describe('getNextPlayer', () => {
  it('returns O when given X', () => {
    expect(getNextPlayer('X')).toBe('O')
  })
  it('returns X when given O', () => {
    expect(getNextPlayer('O')).toBe('X')
  })
})

describe('calculateWinner', () => {
  it('returns null for empty board', () => {
    expect(calculateWinner(createEmptyBoard())).toBeNull()
  })
  it('detects row win', () => {
    const board = ['X', 'X', 'X', null, 'O', 'O', null, null, null]
    const result = calculateWinner(board)
    expect(result?.winner).toBe('X')
    expect(result?.line).toEqual([0, 1, 2])
  })
  it('detects column win', () => {
    const board = ['O', 'X', null, 'O', 'X', null, 'O', null, null]
    const result = calculateWinner(board)
    expect(result?.winner).toBe('O')
    expect(result?.line).toEqual([0, 3, 6])
  })
  it('detects diagonal win', () => {
    const board = ['X', 'O', null, null, 'X', 'O', null, null, 'X']
    const result = calculateWinner(board)
    expect(result?.winner).toBe('X')
    expect(result?.line).toEqual([0, 4, 8])
  })
})

describe('isBoardFull', () => {
  it('returns false for empty board', () => {
    expect(isBoardFull(createEmptyBoard())).toBe(false)
  })
  it('returns true for full board', () => {
    expect(isBoardFull(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'])).toBe(true)
  })
})

describe('getAvailableMoves', () => {
  it('returns all indices for empty board', () => {
    expect(getAvailableMoves(createEmptyBoard())).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })
  it('returns only empty cells', () => {
    const board = ['X', null, 'O', null, null, null, null, null, null]
    expect(getAvailableMoves(board)).toEqual([1, 3, 4, 5, 6, 7, 8])
  })
})

describe('getBestMove', () => {
  it('takes winning move when available', () => {
    const board = ['X', 'X', null, 'O', 'O', null, null, null, null]
    expect(getBestMove(board, 'X', 'O')).toBe(2)
  })
  it('blocks opponent winning move', () => {
    const board = ['O', 'O', null, 'X', null, null, null, null, null]
    expect(getBestMove(board, 'X', 'O')).toBe(2)
  })
  it('returns a valid index for empty board', () => {
    const move = getBestMove(createEmptyBoard(), 'X', 'O')
    expect(move).toBeGreaterThanOrEqual(0)
    expect(move).toBeLessThan(9)
  })
})
```

- [ ] **Step 5: Run noughts-and-crosses tests**

```bash
npx vitest run src/games/noughts-and-crosses/gameLogic.test.ts
```
Expected: All tests PASS.

- [ ] **Step 6: Write minesweeper tests**

Create `src/games/minesweeper/gameLogic.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  createBoard,
  seedBoard,
  revealCells,
  toggleFlag,
  revealAllMines,
  hasWon,
  getFlagsPlaced,
  getNeighborIndices,
} from './gameLogic'

describe('createBoard', () => {
  it('creates board with correct number of cells', () => {
    const board = createBoard(9, 9)
    expect(board).toHaveLength(81)
    expect(board.every((c) => !c.revealed && !c.flagged && !c.mine)).toBe(true)
  })
})

describe('seedBoard', () => {
  it('places the correct number of mines', () => {
    const board = createBoard(9, 9)
    const seeded = seedBoard(board, 9, 9, 10, 0)
    expect(seeded.filter((c) => c.mine)).toHaveLength(10)
  })
  it('does not place a mine on the clicked cell or its neighbors', () => {
    const board = createBoard(9, 9)
    const seeded = seedBoard(board, 9, 9, 10, 0)
    const safeIndices = [0, ...getNeighborIndices(0, 9, 9)]
    for (const i of safeIndices) {
      expect(seeded[i].mine).toBe(false)
    }
  })
  it('computes correct adjacency counts', () => {
    const board = createBoard(3, 3)
    const seeded = seedBoard(board, 3, 3, 1, 0)
    const mineIndex = seeded.findIndex((c) => c.mine)
    const neighbors = getNeighborIndices(mineIndex, 3, 3)
    for (const ni of neighbors) {
      if (!seeded[ni].mine) {
        expect(seeded[ni].adjacentMines).toBeGreaterThan(0)
      }
    }
  })
})

describe('revealCells', () => {
  it('reveals the clicked cell', () => {
    const board = createBoard(3, 3)
    const seeded = seedBoard(board, 3, 3, 1, 0)
    const safeIndex = seeded.findIndex((c) => !c.mine)
    const revealed = revealCells(seeded, safeIndex, 3, 3)
    expect(revealed[safeIndex].revealed).toBe(true)
  })
})

describe('toggleFlag', () => {
  it('flags an unrevealed cell', () => {
    const board = createBoard(3, 3)
    const flagged = toggleFlag(board, 0)
    expect(flagged[0].flagged).toBe(true)
  })
  it('unflags a flagged cell', () => {
    const board = createBoard(3, 3)
    const flagged = toggleFlag(board, 0)
    const unflagged = toggleFlag(flagged, 0)
    expect(unflagged[0].flagged).toBe(false)
  })
  it('does not flag a revealed cell', () => {
    const board = createBoard(3, 3)
    board[0] = { ...board[0], revealed: true }
    const result = toggleFlag(board, 0)
    expect(result[0].flagged).toBe(false)
  })
})

describe('revealAllMines', () => {
  it('reveals all mine cells', () => {
    const board = createBoard(3, 3)
    const seeded = seedBoard(board, 3, 3, 2, 0)
    const revealed = revealAllMines(seeded)
    for (const cell of revealed) {
      if (cell.mine) expect(cell.revealed).toBe(true)
    }
  })
})

describe('hasWon', () => {
  it('returns false when unrevealed non-mine cells remain', () => {
    const board = createBoard(3, 3)
    expect(hasWon(board)).toBe(false)
  })
  it('returns true when all non-mine cells are revealed', () => {
    const board = createBoard(3, 3)
    const seeded = seedBoard(board, 3, 3, 1, 0)
    const allRevealed = seeded.map((c) => (c.mine ? c : { ...c, revealed: true }))
    expect(hasWon(allRevealed)).toBe(true)
  })
})

describe('getFlagsPlaced', () => {
  it('counts flagged cells', () => {
    const board = createBoard(3, 3)
    const flagged = toggleFlag(toggleFlag(board, 0), 1)
    expect(getFlagsPlaced(flagged)).toBe(2)
  })
})

describe('getNeighborIndices', () => {
  it('returns 3 neighbors for corner cell', () => {
    expect(getNeighborIndices(0, 3, 3)).toHaveLength(3)
  })
  it('returns 8 neighbors for center cell', () => {
    expect(getNeighborIndices(4, 3, 3)).toHaveLength(8)
  })
  it('returns 5 neighbors for edge cell', () => {
    expect(getNeighborIndices(1, 3, 3)).toHaveLength(5)
  })
})
```

- [ ] **Step 7: Run minesweeper tests**

```bash
npx vitest run src/games/minesweeper/gameLogic.test.ts
```
Expected: All tests PASS.

- [ ] **Step 8: Write pong tests**

Create `src/games/pong/gameLogic.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  createServeSnapshot,
  advanceSnapshot,
  difficultyConfig,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PADDLE_HEIGHT,
  PLAYER_X,
  AI_X,
} from './gameLogic'

const defaultConfig = {
  ...difficultyConfig.arcade,
  speedMultiplier: 1,
  mode: 'computer' as const,
}

describe('createServeSnapshot', () => {
  it('places ball in center of board', () => {
    const snap = createServeSnapshot(defaultConfig, 'right')
    expect(snap.ballX).toBeCloseTo(BOARD_WIDTH / 2, 0)
    expect(snap.ballY).toBeCloseTo(BOARD_HEIGHT / 2, 0)
  })
  it('sets ball direction based on serve side', () => {
    const right = createServeSnapshot(defaultConfig, 'right')
    expect(right.ballDX).toBeGreaterThan(0)
    const left = createServeSnapshot(defaultConfig, 'left')
    expect(left.ballDX).toBeLessThan(0)
  })
  it('places paddles at default positions', () => {
    const snap = createServeSnapshot(defaultConfig, 'right')
    expect(snap.playerY).toBeCloseTo((BOARD_HEIGHT - PADDLE_HEIGHT) / 2, 0)
    expect(snap.aiY).toBeCloseTo((BOARD_HEIGHT - PADDLE_HEIGHT) / 2, 0)
  })
})

describe('advanceSnapshot', () => {
  it('moves ball forward each frame', () => {
    const snap = createServeSnapshot(defaultConfig, 'right')
    const input = { playerUp: false, playerDown: false, opponentUp: false, opponentDown: false }
    const next = advanceSnapshot(snap, input, defaultConfig)
    expect(next.snapshot.ballX).not.toBe(snap.ballX)
  })
  it('returns no scorer when ball is in play', () => {
    const snap = createServeSnapshot(defaultConfig, 'right')
    const input = { playerUp: false, playerDown: false, opponentUp: false, opponentDown: false }
    const next = advanceSnapshot(snap, input, defaultConfig)
    expect(next.scorer).toBeNull()
  })
  it('moves player paddle up when input is up', () => {
    const snap = createServeSnapshot(defaultConfig, 'right')
    snap.playerY = 50
    const input = { playerUp: true, playerDown: false, opponentUp: false, opponentDown: false }
    const next = advanceSnapshot(snap, input, defaultConfig)
    expect(next.snapshot.playerY).toBeLessThan(50)
  })
})
```

- [ ] **Step 9: Run pong tests**

```bash
npx vitest run src/games/pong/gameLogic.test.ts
```
Expected: All tests PASS.

- [ ] **Step 10: Write solitaire tests**

Create `src/games/solitaire/gameLogic.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  createInitialGame,
  drawFromStock,
  moveToFoundation,
  moveToTableau,
  isValidTableauSelection,
  isWon,
  hasLegalMove,
  formatRank,
  formatSuitGlyph,
  isRed,
  getFoundationSuit,
} from './gameLogic'

describe('createInitialGame', () => {
  it('creates 7 tableau piles', () => {
    const game = createInitialGame()
    expect(game.tableau).toHaveLength(7)
  })
  it('tableau pile i has i+1 cards', () => {
    const game = createInitialGame()
    game.tableau.forEach((pile, i) => {
      expect(pile).toHaveLength(i + 1)
    })
  })
  it('last card in each tableau pile is face up', () => {
    const game = createInitialGame()
    game.tableau.forEach((pile) => {
      expect(pile[pile.length - 1].faceUp).toBe(true)
    })
  })
  it('stock has 24 cards', () => {
    const game = createInitialGame()
    expect(game.stock).toHaveLength(24)
  })
  it('foundations start empty', () => {
    const game = createInitialGame()
    expect(game.foundations.every((f) => f.length === 0)).toBe(true)
  })
  it('waste starts empty', () => {
    const game = createInitialGame()
    expect(game.waste).toHaveLength(0)
  })
})

describe('drawFromStock', () => {
  it('moves up to 3 cards from stock to waste', () => {
    const game = createInitialGame()
    const next = drawFromStock(game)
    expect(next.waste.length).toBe(3)
    expect(next.stock.length).toBe(21)
  })
  it('recycles waste to stock when stock is empty', () => {
    const game = createInitialGame()
    let state = game
    while (state.stock.length > 0) {
      state = drawFromStock(state)
    }
    const recycled = drawFromStock(state)
    expect(recycled.stock.length).toBeGreaterThan(0)
    expect(recycled.waste).toHaveLength(0)
  })
})

describe('isWon', () => {
  it('returns false for initial game', () => {
    expect(isWon(createInitialGame())).toBe(false)
  })
})

describe('hasLegalMove', () => {
  it('returns true for initial game', () => {
    expect(hasLegalMove(createInitialGame())).toBe(true)
  })
})

describe('formatRank', () => {
  it('formats ace', () => expect(formatRank(1)).toBe('A'))
  it('formats number', () => expect(formatRank(7)).toBe('7'))
  it('formats jack', () => expect(formatRank(11)).toBe('J'))
  it('formats queen', () => expect(formatRank(12)).toBe('Q'))
  it('formats king', () => expect(formatRank(13)).toBe('K'))
})

describe('formatSuitGlyph', () => {
  it('formats hearts', () => expect(formatSuitGlyph('hearts')).toBe('♥'))
  it('formats spades', () => expect(formatSuitGlyph('spades')).toBe('♠'))
  it('formats diamonds', () => expect(formatSuitGlyph('diamonds')).toBe('♦'))
  it('formats clubs', () => expect(formatSuitGlyph('clubs')).toBe('♣'))
})

describe('isRed', () => {
  it('hearts is red', () => expect(isRed('hearts')).toBe(true))
  it('diamonds is red', () => expect(isRed('diamonds')).toBe(true))
  it('spades is not red', () => expect(isRed('spades')).toBe(false))
  it('clubs is not red', () => expect(isRed('clubs')).toBe(false))
})

describe('getFoundationSuit', () => {
  it('maps indices to suits', () => {
    expect(getFoundationSuit(0)).toBe('hearts')
    expect(getFoundationSuit(1)).toBe('diamonds')
    expect(getFoundationSuit(2)).toBe('clubs')
    expect(getFoundationSuit(3)).toBe('spades')
  })
})
```

- [ ] **Step 11: Run solitaire tests**

```bash
npx vitest run src/games/solitaire/gameLogic.test.ts
```
Expected: All tests PASS.

- [ ] **Step 12: Run full test suite and commit**

```bash
npm test
git add -A && git commit -m "test: add Vitest and unit tests for all game logic"
git push origin main
```

---

### Task 2: Extract shared hooks (useGameTimer, useGameStats)

**Files:**
- Create: `src/lib/useGameTimer.ts`
- Create: `src/lib/useGameTimer.test.ts`
- Create: `src/lib/useGameStats.ts`
- Create: `src/lib/useGameStats.test.ts`

- [ ] **Step 1: Create useGameTimer hook**

Create `src/lib/useGameTimer.ts`:
```ts
import { useEffect, useRef, useState } from 'react'

export function useGameTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running])

  function reset() {
    setSeconds(0)
  }

  return { seconds, reset }
}
```

- [ ] **Step 2: Create useGameStats hook**

Create `src/lib/useGameStats.ts`:
```ts
import { useLocalStorage } from './useLocalStorage'

type GameStats = {
  wins: number
  losses: number
  bestTime: number | null
}

const defaultStats: GameStats = {
  wins: 0,
  losses: 0,
  bestTime: null,
}

export function useGameStats(gameSlug: string) {
  const [stats, setStats] = useLocalStorage<GameStats>(`${gameSlug}-stats`, defaultStats)

  function recordWin(timeSeconds?: number) {
    setStats((prev) => ({
      ...prev,
      wins: prev.wins + 1,
      bestTime:
        timeSeconds !== undefined
          ? prev.bestTime === null
            ? timeSeconds
            : Math.min(prev.bestTime, timeSeconds)
          : prev.bestTime,
    }))
  }

  function recordLoss() {
    setStats((prev) => ({
      ...prev,
      losses: prev.losses + 1,
    }))
  }

  function resetStats() {
    setStats(defaultStats)
  }

  return { stats, recordWin, recordLoss, resetStats }
}
```

- [ ] **Step 3: Write tests for useGameTimer**

Create `src/lib/useGameTimer.test.ts`:
```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('useGameTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('module exports useGameTimer function', async () => {
    const mod = await import('./useGameTimer')
    expect(typeof mod.useGameTimer).toBe('function')
  })
})
```

- [ ] **Step 4: Write tests for useGameStats**

Create `src/lib/useGameStats.test.ts`:
```ts
import { describe, expect, it } from 'vitest'

describe('useGameStats', () => {
  it('module exports useGameStats function', async () => {
    const mod = await import('./useGameStats')
    expect(typeof mod.useGameStats).toBe('function')
  })
})
```

- [ ] **Step 5: Run tests and commit**

```bash
npm test
git add -A && git commit -m "feat: add shared useGameTimer and useGameStats hooks"
git push origin main
```

---

### Task 3: Add keyboard shortcuts

**Files:**
- Create: `src/lib/useKeyboardShortcut.ts`
- Modify: `src/app/pages/GamePage.tsx` (add restart shortcut)

- [ ] **Step 1: Create useKeyboardShortcut hook**

Create `src/lib/useKeyboardShortcut.ts`:
```ts
import { useEffect } from 'react'

export function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        const target = event.target as HTMLElement
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback])
}
```

- [ ] **Step 2: Commit**

```bash
npm run lint && npm run build
git add -A && git commit -m "feat: add useKeyboardShortcut hook"
git push origin main
```

---

### Task 4: Add sound system

**Files:**
- Create: `src/lib/useSound.ts`

- [ ] **Step 1: Create useSound hook with Web Audio API**

Create `src/lib/useSound.ts`:
```ts
import { useCallback, useRef } from 'react'
import { useLocalStorage } from './useLocalStorage'

type ToneType = 'click' | 'success' | 'fail' | 'move' | 'pop'

const toneConfig: Record<ToneType, { freq: number; duration: number; type: OscillatorType }> = {
  click: { freq: 600, duration: 0.06, type: 'square' },
  success: { freq: 880, duration: 0.18, type: 'sine' },
  fail: { freq: 220, duration: 0.25, type: 'sawtooth' },
  move: { freq: 440, duration: 0.05, type: 'sine' },
  pop: { freq: 520, duration: 0.08, type: 'triangle' },
}

export function useSound() {
  const [muted, setMuted] = useLocalStorage<boolean>('sound-muted', false)
  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback(
    (tone: ToneType) => {
      if (muted) return
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext()
      }
      const ctx = ctxRef.current
      const config = toneConfig[tone]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = config.type
      osc.frequency.value = config.freq
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + config.duration)
    },
    [muted],
  )

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev)
  }, [setMuted])

  return { muted, toggleMute, play }
}
```

- [ ] **Step 2: Commit**

```bash
npm run lint && npm run build
git add -A && git commit -m "feat: add useSound hook with Web Audio API tones"
git push origin main
```

---

### Task 5: Add dark mode

**Files:**
- Create: `src/lib/useTheme.ts`
- Modify: `src/index.css` (add dark mode variables)
- Modify: `src/app/shell/AppShell.tsx` (add theme toggle)

- [ ] **Step 1: Create useTheme hook**

Create `src/lib/useTheme.ts`:
```ts
import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  return { theme, setTheme }
}
```

- [ ] **Step 2: Add dark mode CSS variables**

Add before the first `@media` rule in `src/index.css` (before line 1370):
```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #1a1612;
    --bg-strong: #221e18;
    --surface: rgba(34, 30, 24, 0.88);
    --surface-strong: #2a2520;
    --surface-muted: rgba(34, 30, 24, 0.72);
    --border: rgba(200, 180, 150, 0.18);
    --border-strong: rgba(200, 180, 150, 0.28);
    --text: #e0d6c8;
    --text-soft: #a99880;
    --heading: #f0e8da;
    --accent: #3db9a4;
    --accent-strong: #5cd4bf;
    --accent-soft: rgba(61, 185, 164, 0.12);
    --gold: #d4a04a;
    --danger: #d46b5e;
    --shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
  }
}

:root[data-theme="dark"] {
  --bg: #1a1612;
  --bg-strong: #221e18;
  --surface: rgba(34, 30, 24, 0.88);
  --surface-strong: #2a2520;
  --surface-muted: rgba(34, 30, 24, 0.72);
  --border: rgba(200, 180, 150, 0.18);
  --border-strong: rgba(200, 180, 150, 0.28);
  --text: #e0d6c8;
  --text-soft: #a99880;
  --heading: #f0e8da;
  --accent: #3db9a4;
  --accent-strong: #5cd4bf;
  --accent-soft: rgba(61, 185, 164, 0.12);
  --gold: #d4a04a;
  --danger: #d46b5e;
  --shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
}
```

Also update dark-mode-specific backgrounds. Add after the dark variables block:
```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) body {
    background: linear-gradient(180deg, #1a1612 0%, #1a1612 45%, #12100c 100%);
  }
  :root:not([data-theme="light"]) body::before {
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
  :root:not([data-theme="light"]) .shell {
    border-color: rgba(200, 180, 150, 0.1);
    background: rgba(26, 22, 18, 0.56);
  }
  :root:not([data-theme="light"]) .topbar {
    background: rgba(26, 22, 18, 0.84);
  }
  :root:not([data-theme="light"]) .panel,
  :root:not([data-theme="light"]) .game-card,
  :root:not([data-theme="light"]) .stat-card,
  :root:not([data-theme="light"]) .game-frame,
  :root:not([data-theme="light"]) .game-preview-card {
    background: linear-gradient(180deg, rgba(34, 30, 24, 0.96), rgba(26, 22, 18, 0.85));
  }
  :root:not([data-theme="light"]) .primary-button {
    color: #1a1612;
  }
  :root:not([data-theme="light"]) .solitaire-playing-card {
    background: linear-gradient(180deg, #2a2520, #1a1612);
  }
  :root:not([data-theme="light"]) .mine-cell {
    background: rgba(34, 30, 24, 0.92);
  }
  :root:not([data-theme="light"]) .mine-cell.hidden {
    background: linear-gradient(180deg, #2a2520, #221e18);
  }
  :root:not([data-theme="light"]) .board-cell {
    background: rgba(34, 30, 24, 0.92);
  }
}

:root[data-theme="dark"] body {
  background: linear-gradient(180deg, #1a1612 0%, #1a1612 45%, #12100c 100%);
}
:root[data-theme="dark"] body::before {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
}
:root[data-theme="dark"] .shell {
  border-color: rgba(200, 180, 150, 0.1);
  background: rgba(26, 22, 18, 0.56);
}
:root[data-theme="dark"] .topbar {
  background: rgba(26, 22, 18, 0.84);
}
:root[data-theme="dark"] .panel,
:root[data-theme="dark"] .game-card,
:root[data-theme="dark"] .stat-card,
:root[data-theme="dark"] .game-frame,
:root[data-theme="dark"] .game-preview-card {
  background: linear-gradient(180deg, rgba(34, 30, 24, 0.96), rgba(26, 22, 18, 0.85));
}
:root[data-theme="dark"] .primary-button {
  color: #1a1612;
}
:root[data-theme="dark"] .solitaire-playing-card {
  background: linear-gradient(180deg, #2a2520, #1a1612);
}
:root[data-theme="dark"] .mine-cell {
  background: rgba(34, 30, 24, 0.92);
}
:root[data-theme="dark"] .mine-cell.hidden {
  background: linear-gradient(180deg, #2a2520, #221e18);
}
:root[data-theme="dark"] .board-cell {
  background: rgba(34, 30, 24, 0.92);
}
```

- [ ] **Step 3: Add theme toggle to AppShell**

Modify `src/app/shell/AppShell.tsx` to add a theme toggle button in the topbar:

Import useTheme at top:
```ts
import { useTheme } from '../../lib/useTheme'
```

Inside the component, add:
```ts
const { theme, setTheme } = useTheme()
```

Add a theme toggle button after the `<nav>` element in the topbar:
```tsx
<button
  className="ghost-button"
  onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
  aria-label="Toggle theme"
  title={`Theme: ${theme}`}
>
  {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '⚙️'}
</button>
```

- [ ] **Step 4: Lint, build, and commit**

```bash
npm run lint && npm run build
git add -A && git commit -m "feat: add dark mode with system preference support and manual toggle"
git push origin main
```

---

## Phase 2: New Games

### Task 6: Implement 2048

**Files:**
- Create: `src/games/twenty-forty-eight/gameLogic.ts`
- Create: `src/games/twenty-forty-eight/gameLogic.test.ts`
- Create: `src/games/twenty-forty-eight/TwentyFortyEightGame.tsx`
- Create: `src/games/twenty-forty-eight/TwentyFortyEightPreview.tsx`
- Modify: `src/games/registry.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write 2048 game logic tests**

Create `src/games/twenty-forty-eight/gameLogic.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  createInitialBoard,
  slideRow,
  move,
  hasAvailableMove,
  getBestTile,
  addRandomTile,
} from './gameLogic'

describe('createInitialBoard', () => {
  it('creates a 4x4 grid', () => {
    const board = createInitialBoard()
    expect(board).toHaveLength(4)
    expect(board.every((row) => row.length === 4)).toBe(true)
  })
  it('has exactly 2 non-zero tiles', () => {
    const board = createInitialBoard()
    const count = board.flat().filter((v) => v > 0).length
    expect(count).toBe(2)
  })
})

describe('slideRow', () => {
  it('slides tiles left', () => {
    expect(slideRow([0, 2, 0, 2])).toEqual({ row: [4, 0, 0, 0], score: 4 })
  })
  it('merges only once per slide', () => {
    expect(slideRow([2, 2, 2, 2])).toEqual({ row: [4, 4, 0, 0], score: 8 })
  })
  it('does not merge non-adjacent same tiles past a different tile', () => {
    expect(slideRow([2, 4, 2, 0])).toEqual({ row: [2, 4, 2, 0], score: 0 })
  })
  it('handles empty row', () => {
    expect(slideRow([0, 0, 0, 0])).toEqual({ row: [0, 0, 0, 0], score: 0 })
  })
  it('handles already packed row', () => {
    expect(slideRow([2, 4, 8, 16])).toEqual({ row: [2, 4, 8, 16], score: 0 })
  })
})

describe('move', () => {
  it('returns changed=false when no tiles move', () => {
    const board = [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    const result = move(board, 'left')
    expect(result.changed).toBe(false)
  })
  it('moves tiles in the specified direction', () => {
    const board = [
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    const result = move(board, 'left')
    expect(result.board[0][0]).toBe(2)
    expect(result.changed).toBe(true)
  })
})

describe('hasAvailableMove', () => {
  it('returns true when empty cells exist', () => {
    const board = createInitialBoard()
    expect(hasAvailableMove(board)).toBe(true)
  })
  it('returns false when board is full with no merges', () => {
    const board = [
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 2],
    ]
    expect(hasAvailableMove(board)).toBe(false)
  })
  it('returns true when board is full but merge is possible', () => {
    const board = [
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 4],
    ]
    expect(hasAvailableMove(board)).toBe(true)
  })
})

describe('getBestTile', () => {
  it('returns the highest value on the board', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    expect(getBestTile(board)).toBe(256)
  })
})

describe('addRandomTile', () => {
  it('adds one tile to an empty cell', () => {
    const board = [
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 0],
      [16, 8, 4, 2],
    ]
    const next = addRandomTile(board)
    expect(next[2][3]).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to see them fail**

```bash
npx vitest run src/games/twenty-forty-eight/gameLogic.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement 2048 game logic**

Create `src/games/twenty-forty-eight/gameLogic.ts`:
```ts
export type Board = number[][]
export type Direction = 'up' | 'down' | 'left' | 'right'

export function createInitialBoard(): Board {
  const board = Array.from({ length: 4 }, () => Array(4).fill(0) as number[])
  return addRandomTile(addRandomTile(board))
}

export function slideRow(row: number[]): { row: number[]; score: number } {
  const filtered = row.filter((v) => v !== 0)
  const result: number[] = []
  let score = 0
  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2
      result.push(merged)
      score += merged
      i += 2
    } else {
      result.push(filtered[i])
      i++
    }
  }
  while (result.length < 4) result.push(0)
  return { row: result, score }
}

export function move(board: Board, direction: Direction): { board: Board; score: number; changed: boolean } {
  const rotated = rotateToLeft(board, direction)
  let totalScore = 0
  let changed = false
  const slid = rotated.map((row) => {
    const { row: newRow, score } = slideRow(row)
    totalScore += score
    if (!changed && row.some((v, i) => v !== newRow[i])) changed = true
    return newRow
  })
  const result = rotateFromLeft(slid, direction)
  return { board: result, score: totalScore, changed }
}

export function hasAvailableMove(board: Board): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return true
      if (c + 1 < 4 && board[r][c] === board[r][c + 1]) return true
      if (r + 1 < 4 && board[r][c] === board[r + 1][c]) return true
    }
  }
  return false
}

export function getBestTile(board: Board): number {
  return Math.max(...board.flat())
}

export function addRandomTile(board: Board): Board {
  const empty: [number, number][] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) empty.push([r, c])
    }
  }
  if (empty.length === 0) return board
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  return board.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? value : v)))
}

function rotateToLeft(board: Board, direction: Direction): Board {
  switch (direction) {
    case 'left':
      return board.map((row) => [...row])
    case 'right':
      return board.map((row) => [...row].reverse())
    case 'up':
      return transpose(board)
    case 'down':
      return transpose(board).map((row) => [...row].reverse())
  }
}

function rotateFromLeft(board: Board, direction: Direction): Board {
  switch (direction) {
    case 'left':
      return board
    case 'right':
      return board.map((row) => [...row].reverse())
    case 'up':
      return transpose(board)
    case 'down':
      return transpose(board.map((row) => [...row].reverse()))
  }
}

function transpose(board: Board): Board {
  return board[0].map((_, c) => board.map((row) => row[c]))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/games/twenty-forty-eight/gameLogic.test.ts
```
Expected: All tests PASS.

- [ ] **Step 5: Create 2048 game component**

Create `src/games/twenty-forty-eight/TwentyFortyEightGame.tsx`:
```tsx
import { useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'
import {
  addRandomTile,
  createInitialBoard,
  getBestTile,
  hasAvailableMove,
  move,
  type Board,
  type Direction,
} from './gameLogic'

export function TwentyFortyEightGame() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard())
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useLocalStorage<number>('2048-best', 0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([])

  const bestTile = getBestTile(board)

  function handleMove(direction: Direction) {
    if (gameOver) return
    const result = move(board, direction)
    if (!result.changed) return

    const newBoard = addRandomTile(result.board)
    const newScore = score + result.score

    setHistory((prev) => [...prev.slice(-19), { board, score }])
    setBoard(newBoard)
    setScore(newScore)
    if (newScore > bestScore) setBestScore(newScore)
    if (!won && getBestTile(newBoard) >= 2048) setWon(true)
    if (!hasAvailableMove(newBoard)) setGameOver(true)
  }

  function handleUndo() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setBoard(prev.board)
    setScore(prev.score)
    setHistory((h) => h.slice(0, -1))
    setGameOver(false)
  }

  const handleNewGame = useCallback(() => {
    setBoard(createInitialBoard())
    setScore(0)
    setGameOver(false)
    setWon(false)
    setHistory([])
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }
      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        handleMove(dir)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  useKeyboardShortcut('r', handleNewGame)

  useEffect(() => {
    let startX = 0
    let startY = 0

    function handleTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    function handleTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      if (Math.max(absDx, absDy) < 30) return

      if (absDx > absDy) {
        handleMove(dx > 0 ? 'right' : 'left')
      } else {
        handleMove(dy > 0 ? 'down' : 'up')
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  })

  const statusMessage = gameOver
    ? 'No moves remaining. Press R or tap New Game to try again.'
    : won
      ? `You reached 2048! Keep going for a higher score, or start fresh.`
      : 'Use arrow keys or swipe to slide tiles. Match tiles to merge them.'

  return (
    <article className="game-preview-card playable-card">
      <div className="play-header">
        <h2>2048</h2>
        <div className="action-row">
          <button className="ghost-button" onClick={handleUndo} disabled={history.length === 0}>
            Undo
          </button>
          <button className="ghost-button" onClick={handleNewGame}>
            New Game
          </button>
        </div>
      </div>

      <div className="twenty48-layout">
        <div className="twenty48-main">
          <div className="twenty48-score-row">
            <div className="score-card">
              <span className="score-label">Score</span>
              <strong>{score}</strong>
            </div>
            <div className="score-card">
              <span className="score-label">Best</span>
              <strong>{bestScore}</strong>
            </div>
            <div className="score-card">
              <span className="score-label">Best tile</span>
              <strong>{bestTile}</strong>
            </div>
          </div>

          <div className="twenty48-board">
            {board.flat().map((value, i) => (
              <div
                key={i}
                className={`twenty48-cell${value > 0 ? ` tile-${Math.min(value, 8192)}` : ''}`}
              >
                {value > 0 ? value : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="status-panel" aria-live="polite">
        <span>{statusMessage}</span>
      </div>
    </article>
  )
}
```

- [ ] **Step 6: Create 2048 preview component**

Create `src/games/twenty-forty-eight/TwentyFortyEightPreview.tsx`:
```tsx
const tiles = [2, 4, 8, 16, 32, 64, 128, 256, 512]

export function TwentyFortyEightPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Slide, merge, and reach 2048.</h2>
          <p>A tile-sliding puzzle with undo support and swipe controls for mobile.</p>
        </div>
        <span className="tag">Puzzle</span>
      </div>
      <div className="twenty48-preview-grid" aria-hidden="true">
        {tiles.map((t) => (
          <span key={t} className={`twenty48-preview-tile tile-${t}`}>
            {t}
          </span>
        ))}
      </div>
      <p className="meta-note">Arrow keys or swipe to slide tiles. Matching tiles merge and double.</p>
    </article>
  )
}
```

- [ ] **Step 7: Add 2048 CSS**

Add to `src/index.css` before the responsive media queries:
```css
.twenty48-layout {
  display: grid;
  gap: 18px;
}

.twenty48-main {
  display: grid;
  gap: 18px;
}

.twenty48-score-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.twenty48-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: rgba(255, 251, 244, 0.78);
}

.twenty48-cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 14px;
  font-weight: 800;
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  background: rgba(238, 228, 213, 0.5);
  color: var(--heading);
  transition: transform 100ms ease;
}

.tile-2 { background: #ede4d4; }
.tile-4 { background: #ece0c6; }
.tile-8 { background: #f2b179; color: #f7f1e8; }
.tile-16 { background: #f59563; color: #f7f1e8; }
.tile-32 { background: #f67c5f; color: #f7f1e8; }
.tile-64 { background: #f65e3b; color: #f7f1e8; }
.tile-128 { background: #edcf72; color: #f7f1e8; font-size: clamp(1rem, 2.5vw, 1.6rem); }
.tile-256 { background: #edcc61; color: #f7f1e8; font-size: clamp(1rem, 2.5vw, 1.6rem); }
.tile-512 { background: #edc850; color: #f7f1e8; font-size: clamp(1rem, 2.5vw, 1.6rem); }
.tile-1024 { background: #edc53f; color: #f7f1e8; font-size: clamp(0.85rem, 2vw, 1.4rem); }
.tile-2048 { background: #edc22e; color: #f7f1e8; font-size: clamp(0.85rem, 2vw, 1.4rem); }
.tile-4096 { background: #3c3a32; color: #f7f1e8; font-size: clamp(0.85rem, 2vw, 1.4rem); }
.tile-8192 { background: #3c3a32; color: #f7f1e8; font-size: clamp(0.85rem, 2vw, 1.4rem); }

.twenty48-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.twenty48-preview-tile {
  display: grid;
  place-items: center;
  min-height: 60px;
  border-radius: 14px;
  font-weight: 800;
}
```

- [ ] **Step 8: Register 2048 in registry**

Add import and entry to `src/games/registry.ts`:
```ts
import { TwentyFortyEightGame } from './twenty-forty-eight/TwentyFortyEightGame'
import { TwentyFortyEightPreview } from './twenty-forty-eight/TwentyFortyEightPreview'
```

Add to the `games` array:
```ts
{
  slug: 'twenty-forty-eight',
  name: '2048',
  genre: 'Puzzle',
  status: 'Playable',
  description: 'Slide tiles on a 4x4 grid to merge matching numbers. Reach the 2048 tile to win, with undo and swipe support.',
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
```

- [ ] **Step 9: Add responsive CSS for 2048 in media queries**

In the `@media (max-width: 960px)` block, add `.twenty48-score-row` to the single-column list.

- [ ] **Step 10: Lint, build, test, and commit**

```bash
npm run lint && npm test && npm run build
git add -A && git commit -m "feat: add 2048 game with undo, swipe, and score tracking"
git push origin main
```

---

### Task 7: Implement Snake

**Files:**
- Create: `src/games/snake/gameLogic.ts`
- Create: `src/games/snake/gameLogic.test.ts`
- Create: `src/games/snake/SnakeGame.tsx`
- Create: `src/games/snake/SnakePreview.tsx`
- Modify: `src/games/registry.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write Snake game logic tests**

Create `src/games/snake/gameLogic.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  createInitialState,
  advanceState,
  changeDirection,
  type SnakeState,
} from './gameLogic'

describe('createInitialState', () => {
  it('creates snake in center of grid', () => {
    const state = createInitialState(20, 20)
    expect(state.snake.length).toBeGreaterThanOrEqual(3)
    expect(state.gameOver).toBe(false)
    expect(state.score).toBe(0)
  })
  it('places food on the grid', () => {
    const state = createInitialState(20, 20)
    expect(state.food).toBeDefined()
    expect(state.food.x).toBeGreaterThanOrEqual(0)
    expect(state.food.y).toBeGreaterThanOrEqual(0)
  })
})

describe('changeDirection', () => {
  it('changes to a perpendicular direction', () => {
    const state = createInitialState(20, 20)
    const next = changeDirection(state, 'up')
    expect(next.direction).toBe('up')
  })
  it('prevents 180-degree turn', () => {
    const state = createInitialState(20, 20)
    expect(state.direction).toBe('right')
    const next = changeDirection(state, 'left')
    expect(next.direction).toBe('right')
  })
})

describe('advanceState', () => {
  it('moves snake forward', () => {
    const state = createInitialState(20, 20)
    const headBefore = state.snake[0]
    const next = advanceState(state)
    const headAfter = next.snake[0]
    expect(headAfter.x).not.toBe(headBefore.x) || expect(headAfter.y).not.toBe(headBefore.y)
  })
  it('ends game on wall collision', () => {
    const state: SnakeState = {
      snake: [{ x: 19, y: 0 }, { x: 18, y: 0 }, { x: 17, y: 0 }],
      food: { x: 5, y: 5 },
      direction: 'right',
      gridWidth: 20,
      gridHeight: 20,
      score: 0,
      gameOver: false,
    }
    const next = advanceState(state)
    expect(next.gameOver).toBe(true)
  })
  it('ends game on self collision', () => {
    const state: SnakeState = {
      snake: [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
      ],
      food: { x: 15, y: 15 },
      direction: 'down',
      gridWidth: 20,
      gridHeight: 20,
      score: 0,
      gameOver: false,
    }
    const next = advanceState(state)
    expect(next.gameOver).toBe(true)
  })
  it('grows snake when eating food', () => {
    const state: SnakeState = {
      snake: [{ x: 4, y: 0 }, { x: 3, y: 0 }, { x: 2, y: 0 }],
      food: { x: 5, y: 0 },
      direction: 'right',
      gridWidth: 20,
      gridHeight: 20,
      score: 0,
      gameOver: false,
    }
    const next = advanceState(state)
    expect(next.snake.length).toBe(4)
    expect(next.score).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/games/snake/gameLogic.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Snake game logic**

Create `src/games/snake/gameLogic.ts`:
```ts
export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'

export type SnakeState = {
  snake: Point[]
  food: Point
  direction: Direction
  gridWidth: number
  gridHeight: number
  score: number
  gameOver: boolean
}

const opposites: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

export function createInitialState(gridWidth: number, gridHeight: number): SnakeState {
  const midX = Math.floor(gridWidth / 2)
  const midY = Math.floor(gridHeight / 2)
  const snake: Point[] = [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ]
  const state: SnakeState = {
    snake,
    food: { x: 0, y: 0 },
    direction: 'right',
    gridWidth,
    gridHeight,
    score: 0,
    gameOver: false,
  }
  return { ...state, food: placeFood(state) }
}

export function changeDirection(state: SnakeState, direction: Direction): SnakeState {
  if (opposites[direction] === state.direction) return state
  return { ...state, direction }
}

export function advanceState(state: SnakeState): SnakeState {
  if (state.gameOver) return state

  const head = state.snake[0]
  const next = movePoint(head, state.direction)

  if (next.x < 0 || next.x >= state.gridWidth || next.y < 0 || next.y >= state.gridHeight) {
    return { ...state, gameOver: true }
  }

  if (state.snake.some((s) => s.x === next.x && s.y === next.y)) {
    return { ...state, gameOver: true }
  }

  const ate = next.x === state.food.x && next.y === state.food.y
  const newSnake = [next, ...state.snake]
  if (!ate) newSnake.pop()

  const newState: SnakeState = {
    ...state,
    snake: newSnake,
    score: ate ? state.score + 1 : state.score,
  }

  if (ate) {
    return { ...newState, food: placeFood(newState) }
  }

  return newState
}

function movePoint(point: Point, direction: Direction): Point {
  switch (direction) {
    case 'up':
      return { x: point.x, y: point.y - 1 }
    case 'down':
      return { x: point.x, y: point.y + 1 }
    case 'left':
      return { x: point.x - 1, y: point.y }
    case 'right':
      return { x: point.x + 1, y: point.y }
  }
}

function placeFood(state: SnakeState): Point {
  const occupied = new Set(state.snake.map((s) => `${s.x},${s.y}`))
  const available: Point[] = []
  for (let x = 0; x < state.gridWidth; x++) {
    for (let y = 0; y < state.gridHeight; y++) {
      if (!occupied.has(`${x},${y}`)) available.push({ x, y })
    }
  }
  if (available.length === 0) return { x: 0, y: 0 }
  return available[Math.floor(Math.random() * available.length)]
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/games/snake/gameLogic.test.ts
```
Expected: All tests PASS.

- [ ] **Step 5: Create Snake game component**

Create `src/games/snake/SnakeGame.tsx`:
```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'
import {
  advanceState,
  changeDirection,
  createInitialState,
  type Direction,
  type SnakeState,
} from './gameLogic'

const GRID = 20
const TICK_MS = 120

export function SnakeGame() {
  const [state, setState] = useState<SnakeState>(() => createInitialState(GRID, GRID))
  const [highScore, setHighScore] = useLocalStorage<number>('snake-high', 0)
  const [paused, setPaused] = useState(false)
  const dirQueueRef = useRef<Direction[]>([])
  const tickRef = useRef<number | null>(null)

  const restart = useCallback(() => {
    setState(createInitialState(GRID, GRID))
    setPaused(false)
    dirQueueRef.current = []
  }, [])

  useKeyboardShortcut('r', restart)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      }
      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        dirQueueRef.current.push(dir)
      }
      if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (state.gameOver || paused) return

    tickRef.current = window.setInterval(() => {
      setState((prev) => {
        let current = prev
        while (dirQueueRef.current.length > 0) {
          const dir = dirQueueRef.current.shift()!
          current = changeDirection(current, dir)
        }
        const next = advanceState(current)
        if (next.gameOver && next.score > highScore) {
          setHighScore(next.score)
        }
        return next
      })
    }, TICK_MS)

    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current)
    }
  }, [state.gameOver, paused, highScore, setHighScore])

  useEffect(() => {
    let startX = 0
    let startY = 0

    function handleTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    function handleTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return
      if (Math.abs(dx) > Math.abs(dy)) {
        dirQueueRef.current.push(dx > 0 ? 'right' : 'left')
      } else {
        dirQueueRef.current.push(dy > 0 ? 'down' : 'up')
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const statusMessage = state.gameOver
    ? `Game over! Score: ${state.score}. Press R or tap New Game to restart.`
    : paused
      ? 'Paused. Press Space to resume.'
      : 'Arrow keys or WASD to steer. Space to pause.'

  return (
    <article className="game-preview-card playable-card">
      <div className="play-header">
        <h2>Snake</h2>
        <div className="action-row">
          <button className="ghost-button" onClick={() => setPaused((p) => !p)} disabled={state.gameOver}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button className="ghost-button" onClick={restart}>New Game</button>
        </div>
      </div>

      <div className="snake-layout">
        <div className="snake-main">
          <div className="twenty48-score-row">
            <div className="score-card">
              <span className="score-label">Score</span>
              <strong>{state.score}</strong>
            </div>
            <div className="score-card">
              <span className="score-label">High Score</span>
              <strong>{highScore}</strong>
            </div>
            <div className="score-card">
              <span className="score-label">Length</span>
              <strong>{state.snake.length}</strong>
            </div>
          </div>

          <div className="snake-board" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
            {Array.from({ length: GRID * GRID }, (_, i) => {
              const x = i % GRID
              const y = Math.floor(i / GRID)
              const isHead = state.snake[0].x === x && state.snake[0].y === y
              const isBody = !isHead && state.snake.some((s) => s.x === x && s.y === y)
              const isFood = state.food.x === x && state.food.y === y
              return (
                <div
                  key={i}
                  className={`snake-cell${isHead ? ' snake-head' : ''}${isBody ? ' snake-body' : ''}${isFood ? ' snake-food' : ''}`}
                />
              )
            })}
          </div>
        </div>
      </div>

      <div className="status-panel" aria-live="polite">
        <span>{statusMessage}</span>
      </div>
    </article>
  )
}
```

- [ ] **Step 6: Create Snake preview**

Create `src/games/snake/SnakePreview.tsx`:
```tsx
export function SnakePreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Classic snake on a modern grid.</h2>
          <p>Steer the snake to eat food and grow without hitting walls or yourself.</p>
        </div>
        <span className="tag">Arcade</span>
      </div>
      <div className="snake-preview-grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={`snake-preview-cell${i < 4 ? ' snake-body' : ''}${i === 0 ? ' snake-head' : ''}${i === 7 ? ' snake-food' : ''}`} />
        ))}
      </div>
      <p className="meta-note">Arrow keys, WASD, or swipe to steer. Space to pause.</p>
    </article>
  )
}
```

- [ ] **Step 7: Add Snake CSS**

Add to `src/index.css` before the responsive media queries:
```css
.snake-layout {
  display: grid;
  gap: 18px;
}

.snake-main {
  display: grid;
  gap: 18px;
}

.snake-board {
  display: grid;
  gap: 2px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: rgba(255, 251, 244, 0.78);
  aspect-ratio: 1;
}

.snake-cell {
  border-radius: 3px;
  background: rgba(238, 228, 213, 0.4);
}

.snake-head {
  background: var(--accent-strong);
  border-radius: 5px;
}

.snake-body {
  background: var(--accent);
  border-radius: 4px;
}

.snake-food {
  background: var(--danger);
  border-radius: 50%;
}

.snake-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.snake-preview-cell {
  display: grid;
  place-items: center;
  min-height: 60px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 252, 246, 0.82);
}

.snake-preview-cell.snake-head {
  background: var(--accent-strong);
  border-color: var(--accent-strong);
}

.snake-preview-cell.snake-body {
  background: var(--accent);
  border-color: var(--accent);
}

.snake-preview-cell.snake-food {
  background: var(--danger);
  border-color: var(--danger);
}
```

- [ ] **Step 8: Register Snake in registry**

Add imports and entry to `src/games/registry.ts`:
```ts
import { SnakeGame } from './snake/SnakeGame'
import { SnakePreview } from './snake/SnakePreview'
```

Add entry:
```ts
{
  slug: 'snake',
  name: 'Snake',
  genre: 'Arcade',
  status: 'Playable',
  description: 'Guide the snake to eat food and grow without colliding with walls or your own tail.',
  tags: ['Realtime', 'Keyboard', 'Swipe'],
  highlights: [
    'Arrow keys, WASD, and swipe controls.',
    'Pause with Space bar.',
    'High score tracking.',
  ],
  controls: 'Arrow keys, WASD, or swipe. Space to pause.',
  initialMode: 'Classic snake on a 20x20 grid.',
  expansionPath: 'Speed settings, obstacles, and wrap-around mode.',
  preview: SnakePreview,
  playable: SnakeGame,
},
```

- [ ] **Step 9: Lint, build, test, and commit**

```bash
npm run lint && npm test && npm run build
git add -A && git commit -m "feat: add Snake game with swipe controls and high scores"
git push origin main
```

---

### Task 8: Implement Wordle

**Files:**
- Create: `src/games/wordle/gameLogic.ts`
- Create: `src/games/wordle/gameLogic.test.ts`
- Create: `src/games/wordle/words.ts`
- Create: `src/games/wordle/WordleGame.tsx`
- Create: `src/games/wordle/WordlePreview.tsx`
- Modify: `src/games/registry.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write Wordle game logic tests**

Create `src/games/wordle/gameLogic.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { evaluateGuess, type LetterResult } from './gameLogic'

describe('evaluateGuess', () => {
  it('marks all correct when guess matches answer', () => {
    const result = evaluateGuess('hello', 'hello')
    expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])
  })
  it('marks absent letters', () => {
    const result = evaluateGuess('abcde', 'fghij')
    expect(result).toEqual(['absent', 'absent', 'absent', 'absent', 'absent'])
  })
  it('marks present letters in wrong position', () => {
    const result = evaluateGuess('abcde', 'edcba')
    expect(result).toEqual(['present', 'present', 'correct', 'present', 'present'])
  })
  it('handles duplicate letters correctly', () => {
    const result = evaluateGuess('speed', 'abide')
    expect(result[0]).toBe('absent')
    expect(result[1]).toBe('absent')
    expect(result[2]).toBe('present')
    expect(result[3]).toBe('present')
    expect(result[4]).toBe('absent')
  })
  it('does not double-count present letters', () => {
    const result = evaluateGuess('alloy', 'label')
    expect(result[0]).toBe('present')
    expect(result[1]).toBe('present')
    expect(result[2]).toBe('absent')
    expect(result[3]).toBe('absent')
    expect(result[4]).toBe('absent')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/games/wordle/gameLogic.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement Wordle game logic**

Create `src/games/wordle/gameLogic.ts`:
```ts
export type LetterResult = 'correct' | 'present' | 'absent'

export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  const result: LetterResult[] = Array(5).fill('absent')
  const answerChars = answer.split('')
  const remaining: (string | null)[] = [...answerChars]

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct'
      remaining[i] = null
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue
    const idx = remaining.indexOf(guess[i])
    if (idx !== -1) {
      result[i] = 'present'
      remaining[idx] = null
    }
  }

  return result
}

export function getWordForDate(words: string[], date: Date): string {
  const start = new Date(2024, 0, 1)
  const diff = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return words[((diff % words.length) + words.length) % words.length]
}

export function isValidWord(word: string, dictionary: Set<string>): boolean {
  return dictionary.has(word.toLowerCase())
}
```

- [ ] **Step 4: Create word list**

Create `src/games/wordle/words.ts`:
```ts
export const answers: string[] = [
  'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult', 'after', 'again',
  'agent', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alien', 'align', 'alive', 'allow',
  'alone', 'along', 'alter', 'anger', 'angle', 'angry', 'anime', 'apart', 'apple', 'apply',
  'arena', 'argue', 'arise', 'aside', 'asset', 'audio', 'audit', 'avoid', 'awake', 'award',
  'aware', 'badly', 'baker', 'bases', 'basic', 'basis', 'beach', 'began', 'begin', 'being',
  'below', 'bench', 'billy', 'birth', 'black', 'blade', 'blame', 'bland', 'blank', 'blast',
  'blaze', 'bleed', 'blend', 'bless', 'blind', 'block', 'blood', 'bloom', 'blown', 'board',
  'bonus', 'bound', 'brain', 'brand', 'brave', 'bread', 'break', 'breed', 'brick', 'brief',
  'bring', 'broad', 'broke', 'brook', 'brown', 'brush', 'build', 'built', 'bunch', 'burst',
  'buyer', 'cabin', 'cable', 'candy', 'cargo', 'carry', 'catch', 'cause', 'cease', 'chain',
  'chair', 'chaos', 'charm', 'chase', 'cheap', 'check', 'cheek', 'chess', 'chest', 'chief',
  'child', 'china', 'chunk', 'civic', 'civil', 'claim', 'class', 'clean', 'clear', 'click',
  'cliff', 'climb', 'cling', 'clock', 'clone', 'close', 'cloud', 'coach', 'coast', 'coral',
  'could', 'count', 'court', 'cover', 'craft', 'crash', 'crazy', 'cream', 'crime', 'cross',
  'crowd', 'crown', 'cruel', 'crush', 'curve', 'cycle', 'daily', 'dance', 'death', 'debut',
  'delay', 'delta', 'dense', 'depth', 'derby', 'devil', 'dirty', 'doubt', 'dough', 'draft',
  'drain', 'drama', 'drank', 'drawn', 'dream', 'dress', 'drift', 'drill', 'drink', 'drive',
  'drove', 'dying', 'eager', 'eagle', 'early', 'earth', 'eight', 'elect', 'elite', 'empty',
  'enemy', 'enjoy', 'enter', 'entry', 'equal', 'error', 'essay', 'event', 'every', 'exact',
  'exert', 'exist', 'extra', 'faint', 'faith', 'false', 'fancy', 'fatal', 'fault', 'feast',
  'fence', 'ferry', 'fewer', 'fiber', 'field', 'fifth', 'fifty', 'fight', 'final', 'first',
  'fixed', 'flame', 'flash', 'fleet', 'flesh', 'float', 'flood', 'floor', 'fluid', 'flush',
  'focus', 'force', 'forge', 'forth', 'found', 'frame', 'frank', 'fraud', 'fresh', 'front',
  'frost', 'fruit', 'fully', 'funny', 'ghost', 'giant', 'given', 'glass', 'globe', 'glory',
  'going', 'grace', 'grade', 'grain', 'grand', 'grant', 'graph', 'grasp', 'grass', 'grave',
  'great', 'green', 'greet', 'grief', 'grind', 'grip', 'gross', 'group', 'grove', 'grown',
  'guard', 'guess', 'guest', 'guide', 'guild', 'guilt', 'happy', 'harsh', 'heart', 'heavy',
  'hence', 'herbs', 'honor', 'horse', 'hotel', 'house', 'human', 'humor', 'ideal', 'image',
  'imply', 'index', 'indie', 'inner', 'input', 'issue', 'ivory', 'jenny', 'jewel', 'jimmy',
  'joint', 'joker', 'judge', 'juice', 'known', 'label', 'labor', 'large', 'laser', 'later',
  'laugh', 'layer', 'learn', 'lease', 'leave', 'legal', 'level', 'light', 'limit', 'linen',
  'liver', 'lobby', 'local', 'logic', 'lonely', 'loose', 'lover', 'lower', 'lucky', 'lunch',
  'magic', 'major', 'maker', 'march', 'marry', 'match', 'mayor', 'media', 'mercy', 'merit',
  'metal', 'meter', 'might', 'minor', 'minus', 'mixed', 'model', 'money', 'month', 'moral',
  'motor', 'mount', 'mouse', 'mouth', 'movie', 'music', 'naive', 'nerve', 'never', 'night',
  'noble', 'noise', 'north', 'noted', 'novel', 'nurse', 'nylon', 'occur', 'ocean', 'offer',
  'often', 'olive', 'onset', 'opera', 'orbit', 'order', 'organ', 'other', 'ought', 'outer',
  'owner', 'oxide', 'ozone', 'paint', 'panel', 'panic', 'paper', 'party', 'pasta', 'patch',
  'pause', 'peace', 'pearl', 'penny', 'phase', 'phone', 'photo', 'piano', 'piece', 'pilot',
  'pitch', 'pixel', 'pizza', 'place', 'plain', 'plane', 'plant', 'plate', 'plaza', 'plead',
  'plaza', 'plumb', 'plume', 'point', 'polar', 'popup', 'pound', 'power', 'press', 'price',
  'pride', 'prime', 'print', 'prior', 'prize', 'proof', 'proud', 'prove', 'psalm', 'pulse',
  'punch', 'pupil', 'purse', 'queen', 'quest', 'quick', 'quiet', 'quota', 'quote', 'radar',
  'radio', 'raise', 'range', 'rapid', 'ratio', 'reach', 'react', 'ready', 'realm', 'rebel',
  'refer', 'reign', 'relax', 'reply', 'rider', 'ridge', 'rifle', 'right', 'rigid', 'rival',
  'river', 'robin', 'robot', 'rocky', 'roger', 'rouge', 'rough', 'round', 'route', 'royal',
  'rugby', 'ruler', 'rural', 'sadly', 'saint', 'salad', 'sauce', 'scale', 'scene', 'scope',
  'score', 'scout', 'screw', 'sense', 'serve', 'setup', 'seven', 'shade', 'shake', 'shall',
  'shame', 'shape', 'share', 'shark', 'sharp', 'shave', 'shelf', 'shell', 'shift', 'shine',
  'shirt', 'shock', 'shoot', 'shore', 'short', 'shout', 'shown', 'sight', 'sigma', 'silly',
  'since', 'sixth', 'sixty', 'sized', 'skill', 'skull', 'slate', 'slave', 'sleep', 'slice',
  'slide', 'slope', 'smart', 'smell', 'smile', 'smoke', 'snake', 'solar', 'solid', 'solve',
  'sorry', 'sound', 'south', 'space', 'spare', 'speak', 'speed', 'spend', 'spent', 'spice',
  'spine', 'split', 'spoke', 'sport', 'spray', 'squad', 'stack', 'staff', 'stage', 'stake',
  'stall', 'stamp', 'stand', 'stark', 'start', 'state', 'steal', 'steam', 'steel', 'steep',
  'steer', 'stern', 'stick', 'still', 'stock', 'stone', 'stood', 'store', 'storm', 'story',
  'stove', 'strip', 'stuck', 'study', 'stuff', 'style', 'sugar', 'suite', 'super', 'surge',
  'swamp', 'swear', 'sweep', 'sweet', 'swift', 'swing', 'sword', 'syrup', 'table', 'taste',
  'teach', 'tempo', 'tense', 'terms', 'theft', 'their', 'theme', 'thick', 'thing', 'think',
  'third', 'those', 'three', 'threw', 'throw', 'thumb', 'tiger', 'tight', 'timer', 'tired',
  'title', 'today', 'token', 'topic', 'total', 'touch', 'tough', 'towel', 'tower', 'toxic',
  'trace', 'track', 'trade', 'trail', 'train', 'trait', 'trash', 'treat', 'trend', 'trial',
  'tribe', 'trick', 'troop', 'truck', 'truly', 'trump', 'trunk', 'trust', 'truth', 'tulip',
  'tumor', 'ultra', 'uncle', 'under', 'union', 'unity', 'until', 'upper', 'upset', 'urban',
  'usage', 'usual', 'valid', 'value', 'valve', 'vault', 'verse', 'video', 'vigor', 'vinyl',
  'viola', 'virus', 'visit', 'vital', 'vivid', 'vocal', 'vodka', 'voice', 'voter', 'waist',
  'waste', 'watch', 'water', 'weave', 'wedge', 'weigh', 'weird', 'wheat', 'wheel', 'where',
  'which', 'while', 'white', 'whole', 'whose', 'width', 'witch', 'woman', 'woods', 'world',
  'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'write', 'wrong', 'wrote', 'yacht',
  'yield', 'young', 'youth', 'zebra',
]

export const dictionary: Set<string> = new Set(answers)
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/games/wordle/gameLogic.test.ts
```
Expected: All tests PASS.

- [ ] **Step 6: Create Wordle game component**

Create `src/games/wordle/WordleGame.tsx`:
```tsx
import { useCallback, useEffect, useState } from 'vitest'
```

Wait — that's wrong. Let me correct:

Create `src/games/wordle/WordleGame.tsx`:
```tsx
import { useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { evaluateGuess, getWordForDate, isValidWord, type LetterResult } from './gameLogic'
import { answers, dictionary } from './words'

type GamePhase = 'playing' | 'won' | 'lost'

type Guess = {
  word: string
  result: LetterResult[]
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back'],
]

export function WordleGame() {
  const todayKey = new Date().toISOString().slice(0, 10)
  const answer = getWordForDate(answers, new Date())

  const [guesses, setGuesses] = useLocalStorage<Guess[]>(`wordle-${todayKey}`, [])
  const [current, setCurrent] = useState('')
  const [shake, setShake] = useState(false)
  const [stats, setStats] = useLocalStorage<{ played: number; won: number }>('wordle-stats', { played: 0, won: 0 })

  const phase: GamePhase =
    guesses.some((g) => g.result.every((r) => r === 'correct'))
      ? 'won'
      : guesses.length >= 6
        ? 'lost'
        : 'playing'

  const letterStates = new Map<string, LetterResult>()
  for (const guess of guesses) {
    for (let i = 0; i < 5; i++) {
      const letter = guess.word[i]
      const current = letterStates.get(letter)
      const next = guess.result[i]
      if (!current || next === 'correct' || (next === 'present' && current === 'absent')) {
        letterStates.set(letter, next)
      }
    }
  }

  const submitGuess = useCallback(() => {
    if (current.length !== 5 || phase !== 'playing') return
    if (!isValidWord(current, dictionary)) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    const result = evaluateGuess(current, answer)
    const newGuesses = [...guesses, { word: current, result }]
    setGuesses(newGuesses)
    setCurrent('')

    const isWin = result.every((r) => r === 'correct')
    const isLastGuess = newGuesses.length >= 6
    if (isWin || isLastGuess) {
      setStats((prev) => ({
        played: prev.played + 1,
        won: isWin ? prev.won + 1 : prev.won,
      }))
    }
  }, [current, phase, answer, guesses, setGuesses, setStats])

  const handleKey = useCallback(
    (key: string) => {
      if (phase !== 'playing') return
      if (key === 'enter') {
        submitGuess()
      } else if (key === 'back') {
        setCurrent((c) => c.slice(0, -1))
      } else if (key.length === 1 && /^[a-z]$/.test(key) && current.length < 5) {
        setCurrent((c) => c + key)
      }
    },
    [phase, current, submitGuess],
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter') handleKey('enter')
      else if (e.key === 'Backspace') handleKey('back')
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toLowerCase())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  const statusMessage =
    phase === 'won'
      ? `You got it in ${guesses.length}! Come back tomorrow for a new word.`
      : phase === 'lost'
        ? `The word was "${answer.toUpperCase()}". Come back tomorrow for a new word.`
        : guesses.length === 0
          ? 'Guess the five-letter word. You have six attempts.'
          : `Attempt ${guesses.length + 1} of 6.`

  return (
    <article className="game-preview-card playable-card">
      <div className="play-header">
        <h2>Wordle</h2>
        <div className="action-row">
          <span className="score-label">
            {stats.won}/{stats.played} won
          </span>
        </div>
      </div>

      <div className="wordle-layout">
        <div className="wordle-board">
          {Array.from({ length: 6 }, (_, row) => {
            const guess = guesses[row]
            const isCurrent = row === guesses.length && phase === 'playing'
            return (
              <div key={row} className={`wordle-row${isCurrent && shake ? ' wordle-shake' : ''}`}>
                {Array.from({ length: 5 }, (_, col) => {
                  const letter = guess ? guess.word[col] : isCurrent ? current[col] || '' : ''
                  const state = guess ? guess.result[col] : undefined
                  return (
                    <div
                      key={col}
                      className={`wordle-cell${state ? ` wordle-${state}` : ''}${!guess && letter ? ' wordle-filled' : ''}`}
                    >
                      {letter.toUpperCase()}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        <div className="wordle-keyboard">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="wordle-key-row">
              {row.map((key) => {
                const state = letterStates.get(key)
                return (
                  <button
                    key={key}
                    className={`wordle-key${state ? ` wordle-${state}` : ''}${key === 'enter' || key === 'back' ? ' wordle-key-wide' : ''}`}
                    onClick={() => handleKey(key)}
                  >
                    {key === 'back' ? '←' : key.toUpperCase()}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="status-panel" aria-live="polite">
        <span>{statusMessage}</span>
      </div>
    </article>
  )
}
```

- [ ] **Step 7: Create Wordle preview**

Create `src/games/wordle/WordlePreview.tsx`:
```tsx
const tiles = [
  { letter: 'W', state: 'correct' },
  { letter: 'O', state: 'absent' },
  { letter: 'R', state: 'present' },
  { letter: 'D', state: 'absent' },
  { letter: 'S', state: 'correct' },
]

export function WordlePreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Guess the daily five-letter word.</h2>
          <p>Six attempts with color-coded feedback after each guess.</p>
        </div>
        <span className="tag">Word</span>
      </div>
      <div className="wordle-preview-row" aria-hidden="true">
        {tiles.map((t) => (
          <span key={t.letter} className={`wordle-preview-tile wordle-${t.state}`}>
            {t.letter}
          </span>
        ))}
      </div>
      <p className="meta-note">A new word every day. Type or tap the on-screen keyboard.</p>
    </article>
  )
}
```

- [ ] **Step 8: Add Wordle CSS**

Add to `src/index.css` before the responsive media queries:
```css
.wordle-layout {
  display: grid;
  gap: 18px;
  max-width: 500px;
  margin: 0 auto;
}

.wordle-board {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.wordle-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  width: 100%;
}

.wordle-shake {
  animation: wordle-shake 0.4s ease;
}

@keyframes wordle-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.wordle-cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border: 2px solid var(--border-strong);
  border-radius: 10px;
  font-weight: 800;
  font-size: clamp(1.4rem, 4vw, 2rem);
  color: var(--heading);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.wordle-filled {
  border-color: var(--text-soft);
}

.wordle-correct {
  background: #6aaa64;
  border-color: #6aaa64;
  color: #fff;
}

.wordle-present {
  background: #c9b458;
  border-color: #c9b458;
  color: #fff;
}

.wordle-absent {
  background: #787c7e;
  border-color: #787c7e;
  color: #fff;
}

.wordle-keyboard {
  display: grid;
  gap: 6px;
}

.wordle-key-row {
  display: flex;
  justify-content: center;
  gap: 5px;
}

.wordle-key {
  min-height: 52px;
  min-width: 34px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(255, 251, 242, 0.88);
  color: var(--heading);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 80ms ease, background-color 120ms ease;
}

.wordle-key:active {
  transform: translateY(1px);
}

.wordle-key-wide {
  min-width: 56px;
  font-size: 0.75rem;
}

.wordle-key.wordle-correct {
  background: #6aaa64;
  border-color: #6aaa64;
  color: #fff;
}

.wordle-key.wordle-present {
  background: #c9b458;
  border-color: #c9b458;
  color: #fff;
}

.wordle-key.wordle-absent {
  background: #787c7e;
  border-color: #787c7e;
  color: #fff;
}

.wordle-preview-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.wordle-preview-tile {
  display: grid;
  place-items: center;
  min-height: 60px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 1.4rem;
  color: #fff;
}
```

- [ ] **Step 9: Register Wordle in registry**

Add imports and entry to `src/games/registry.ts`:
```ts
import { WordleGame } from './wordle/WordleGame'
import { WordlePreview } from './wordle/WordlePreview'
```

Add entry:
```ts
{
  slug: 'wordle',
  name: 'Wordle',
  genre: 'Word',
  status: 'Playable',
  description: 'Guess the daily five-letter word in six attempts with color-coded feedback.',
  tags: ['Daily puzzle', 'Keyboard', 'Word game'],
  highlights: [
    'A new word every day, seeded by date.',
    'Color-coded letter feedback: green, yellow, gray.',
    'On-screen keyboard with letter state tracking.',
  ],
  controls: 'Type or tap the on-screen keyboard. Enter to submit, Backspace to delete.',
  initialMode: 'Daily five-letter word with six guesses.',
  expansionPath: 'Hard mode, sharing results, and extended stats.',
  preview: WordlePreview,
  playable: WordleGame,
},
```

- [ ] **Step 10: Lint, build, test, and commit**

```bash
npm run lint && npm test && npm run build
git add -A && git commit -m "feat: add Wordle game with daily word and on-screen keyboard"
git push origin main
```

---

### Task 9: Implement Tetris

**Files:**
- Create: `src/games/tetris/gameLogic.ts`
- Create: `src/games/tetris/gameLogic.test.ts`
- Create: `src/games/tetris/TetrisGame.tsx`
- Create: `src/games/tetris/TetrisPreview.tsx`
- Modify: `src/games/registry.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write Tetris game logic tests**

Create `src/games/tetris/gameLogic.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  createBoard,
  spawnPiece,
  movePiece,
  rotatePiece,
  lockPiece,
  clearLines,
  hasCollision,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  type TetrisBoard,
  type Piece,
  PIECES,
} from './gameLogic'

describe('createBoard', () => {
  it('creates a 10x20 grid of zeros', () => {
    const board = createBoard()
    expect(board).toHaveLength(BOARD_HEIGHT)
    expect(board.every((row) => row.length === BOARD_WIDTH)).toBe(true)
    expect(board.every((row) => row.every((cell) => cell === 0))).toBe(true)
  })
})

describe('spawnPiece', () => {
  it('creates a piece at top center', () => {
    const piece = spawnPiece('T')
    expect(piece.type).toBe('T')
    expect(piece.y).toBe(0)
    expect(piece.x).toBeGreaterThanOrEqual(3)
    expect(piece.x).toBeLessThanOrEqual(4)
  })
})

describe('movePiece', () => {
  it('moves piece left', () => {
    const piece = spawnPiece('O')
    const moved = movePiece(piece, -1, 0)
    expect(moved.x).toBe(piece.x - 1)
  })
  it('moves piece down', () => {
    const piece = spawnPiece('O')
    const moved = movePiece(piece, 0, 1)
    expect(moved.y).toBe(piece.y + 1)
  })
})

describe('rotatePiece', () => {
  it('rotates piece shape', () => {
    const piece = spawnPiece('T')
    const rotated = rotatePiece(piece)
    expect(rotated.shape).not.toEqual(piece.shape)
    expect(rotated.rotation).toBe(1)
  })
  it('wraps rotation after 4', () => {
    let piece = spawnPiece('T')
    for (let i = 0; i < 4; i++) piece = rotatePiece(piece)
    expect(piece.rotation).toBe(0)
  })
})

describe('hasCollision', () => {
  it('detects wall collision on left', () => {
    const board = createBoard()
    const piece = { ...spawnPiece('O'), x: -1 }
    expect(hasCollision(board, piece)).toBe(true)
  })
  it('detects floor collision', () => {
    const board = createBoard()
    const piece = { ...spawnPiece('O'), y: BOARD_HEIGHT }
    expect(hasCollision(board, piece)).toBe(true)
  })
  it('no collision in valid position', () => {
    const board = createBoard()
    const piece = spawnPiece('O')
    expect(hasCollision(board, piece)).toBe(false)
  })
})

describe('lockPiece', () => {
  it('places piece cells onto board', () => {
    const board = createBoard()
    const piece = { ...spawnPiece('O'), y: BOARD_HEIGHT - 2 }
    const locked = lockPiece(board, piece)
    const nonZeroCells = locked.flat().filter((c) => c !== 0).length
    expect(nonZeroCells).toBeGreaterThan(0)
  })
})

describe('clearLines', () => {
  it('clears full rows and returns count', () => {
    const board = createBoard()
    board[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill(1)
    const { board: cleared, linesCleared } = clearLines(board)
    expect(linesCleared).toBe(1)
    expect(cleared[BOARD_HEIGHT - 1].every((c) => c === 0)).toBe(true)
  })
  it('returns 0 when no lines are full', () => {
    const board = createBoard()
    const { linesCleared } = clearLines(board)
    expect(linesCleared).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/games/tetris/gameLogic.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement Tetris game logic**

Create `src/games/tetris/gameLogic.ts`:
```ts
export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export type TetrisBoard = number[][]
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export type Piece = {
  type: PieceType
  shape: number[][]
  x: number
  y: number
  rotation: number
}

export const PIECES: Record<PieceType, number[][][]> = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
  ],
  O: [
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]],
  ],
}

const PIECE_COLORS: Record<PieceType, number> = {
  I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7,
}

export function createBoard(): TetrisBoard {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0) as number[])
}

export function spawnPiece(type: PieceType): Piece {
  const shape = PIECES[type][0]
  return {
    type,
    shape,
    x: Math.floor((BOARD_WIDTH - shape[0].length) / 2),
    y: 0,
    rotation: 0,
  }
}

export function movePiece(piece: Piece, dx: number, dy: number): Piece {
  return { ...piece, x: piece.x + dx, y: piece.y + dy }
}

export function rotatePiece(piece: Piece): Piece {
  const nextRotation = (piece.rotation + 1) % 4
  return {
    ...piece,
    shape: PIECES[piece.type][nextRotation],
    rotation: nextRotation,
  }
}

export function hasCollision(board: TetrisBoard, piece: Piece): boolean {
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] === 0) continue
      const boardX = piece.x + col
      const boardY = piece.y + row
      if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return true
      if (boardY < 0) continue
      if (board[boardY][boardX] !== 0) return true
    }
  }
  return false
}

export function lockPiece(board: TetrisBoard, piece: Piece): TetrisBoard {
  const newBoard = board.map((row) => [...row])
  const color = PIECE_COLORS[piece.type]
  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col] === 0) continue
      const boardY = piece.y + row
      const boardX = piece.x + col
      if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
        newBoard[boardY][boardX] = color
      }
    }
  }
  return newBoard
}

export function clearLines(board: TetrisBoard): { board: TetrisBoard; linesCleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === 0))
  const linesCleared = BOARD_HEIGHT - remaining.length
  const emptyRows = Array.from({ length: linesCleared }, () => Array(BOARD_WIDTH).fill(0) as number[])
  return { board: [...emptyRows, ...remaining], linesCleared }
}

export function getRandomPiece(): PieceType {
  const types: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
  return types[Math.floor(Math.random() * types.length)]
}

export function getGhostY(board: TetrisBoard, piece: Piece): number {
  let ghost = piece
  while (!hasCollision(board, movePiece(ghost, 0, 1))) {
    ghost = movePiece(ghost, 0, 1)
  }
  return ghost.y
}

export function calculateScore(linesCleared: number, level: number): number {
  const points = [0, 100, 300, 500, 800]
  return (points[linesCleared] || 0) * (level + 1)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/games/tetris/gameLogic.test.ts
```
Expected: All tests PASS.

- [ ] **Step 5: Create Tetris game component**

Create `src/games/tetris/TetrisGame.tsx`:
```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'
import {
  createBoard,
  spawnPiece,
  movePiece,
  rotatePiece,
  lockPiece,
  clearLines,
  hasCollision,
  getRandomPiece,
  getGhostY,
  calculateScore,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  type TetrisBoard,
  type Piece,
} from './gameLogic'

const PIECE_CLASSES = ['', 'piece-i', 'piece-o', 'piece-t', 'piece-s', 'piece-z', 'piece-j', 'piece-l']

export function TetrisGame() {
  const [board, setBoard] = useState<TetrisBoard>(() => createBoard())
  const [piece, setPiece] = useState<Piece>(() => spawnPiece(getRandomPiece()))
  const [nextType, setNextType] = useState(() => getRandomPiece())
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [highScore, setHighScore] = useLocalStorage<number>('tetris-high', 0)

  const tickRef = useRef<number | null>(null)

  const dropSpeed = Math.max(100, 800 - level * 70)

  const spawnNext = useCallback(() => {
    const next = spawnPiece(nextType)
    setNextType(getRandomPiece())
    if (hasCollision(board, next)) {
      setGameOver(true)
      return
    }
    setPiece(next)
  }, [board, nextType])

  const lockAndClear = useCallback(
    (currentBoard: TetrisBoard, currentPiece: Piece) => {
      const locked = lockPiece(currentBoard, currentPiece)
      const { board: cleared, linesCleared } = clearLines(locked)
      const points = calculateScore(linesCleared, level)
      const newLines = lines + linesCleared
      const newScore = score + points
      setBoard(cleared)
      setLines(newLines)
      setLevel(Math.floor(newLines / 10))
      setScore(newScore)
      if (newScore > highScore) setHighScore(newScore)

      const next = spawnPiece(nextType)
      setNextType(getRandomPiece())
      if (hasCollision(cleared, next)) {
        setGameOver(true)
      } else {
        setPiece(next)
      }
    },
    [level, lines, score, highScore, setHighScore, nextType],
  )

  const tryMove = useCallback(
    (dx: number, dy: number) => {
      const moved = movePiece(piece, dx, dy)
      if (!hasCollision(board, moved)) {
        setPiece(moved)
        return true
      }
      return false
    },
    [board, piece],
  )

  const tryRotate = useCallback(() => {
    const rotated = rotatePiece(piece)
    if (!hasCollision(board, rotated)) {
      setPiece(rotated)
      return
    }
    for (const kick of [-1, 1, -2, 2]) {
      const kicked = movePiece(rotated, kick, 0)
      if (!hasCollision(board, kicked)) {
        setPiece(kicked)
        return
      }
    }
  }, [board, piece])

  const hardDrop = useCallback(() => {
    let dropped = piece
    while (!hasCollision(board, movePiece(dropped, 0, 1))) {
      dropped = movePiece(dropped, 0, 1)
    }
    lockAndClear(board, dropped)
  }, [board, piece, lockAndClear])

  const restart = useCallback(() => {
    setBoard(createBoard())
    setPiece(spawnPiece(getRandomPiece()))
    setNextType(getRandomPiece())
    setScore(0)
    setLines(0)
    setLevel(0)
    setGameOver(false)
    setPaused(false)
  }, [])

  useKeyboardShortcut('r', restart)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (gameOver) return
      if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
        return
      }
      if (paused) return
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          tryMove(-1, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          tryMove(1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          tryMove(0, 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          tryRotate()
          break
        case 'z':
          e.preventDefault()
          tryRotate()
          break
        case 'x':
          e.preventDefault()
          hardDrop()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameOver, paused, tryMove, tryRotate, hardDrop])

  useEffect(() => {
    if (gameOver || paused) return
    tickRef.current = window.setInterval(() => {
      setPiece((prev) => {
        const moved = movePiece(prev, 0, 1)
        if (!hasCollision(board, moved)) return moved
        lockAndClear(board, prev)
        return prev
      })
    }, dropSpeed)
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current)
    }
  }, [gameOver, paused, board, dropSpeed, lockAndClear])

  const ghostY = getGhostY(board, piece)

  const renderBoard = () => {
    const display = board.map((row) => [...row])

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue
        const gy = ghostY + r
        if (gy >= 0 && gy < BOARD_HEIGHT) {
          const gx = piece.x + c
          if (gx >= 0 && gx < BOARD_WIDTH && display[gy][gx] === 0) {
            display[gy][gx] = 8
          }
        }
      }
    }

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue
        const by = piece.y + r
        const bx = piece.x + c
        if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
          display[by][bx] = { I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 }[piece.type]
        }
      }
    }

    return display
  }

  const display = renderBoard()

  const statusMessage = gameOver
    ? `Game over! Score: ${score}. Press R to restart.`
    : paused
      ? 'Paused. Press Space to resume.'
      : 'Arrow keys to move and rotate. X for hard drop. Space to pause.'

  return (
    <article className="game-preview-card playable-card">
      <div className="play-header">
        <h2>Tetris</h2>
        <div className="action-row">
          <button className="ghost-button" onClick={() => setPaused((p) => !p)} disabled={gameOver}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button className="ghost-button" onClick={restart}>New Game</button>
        </div>
      </div>

      <div className="tetris-layout">
        <div className="tetris-main">
          <div className="tetris-board">
            {display.flat().map((cell, i) => (
              <div key={i} className={`tetris-cell${cell > 0 ? ` ${PIECE_CLASSES[cell] || 'piece-ghost'}` : ''}`} />
            ))}
          </div>
        </div>
        <div className="tetris-side">
          <div className="score-card">
            <span className="score-label">Score</span>
            <strong>{score}</strong>
          </div>
          <div className="score-card">
            <span className="score-label">Lines</span>
            <strong>{lines}</strong>
          </div>
          <div className="score-card">
            <span className="score-label">Level</span>
            <strong>{level}</strong>
          </div>
          <div className="score-card">
            <span className="score-label">High Score</span>
            <strong>{highScore}</strong>
          </div>
        </div>
      </div>

      <div className="status-panel" aria-live="polite">
        <span>{statusMessage}</span>
      </div>
    </article>
  )
}
```

- [ ] **Step 6: Create Tetris preview**

Create `src/games/tetris/TetrisPreview.tsx`:
```tsx
export function TetrisPreview() {
  const blocks = ['piece-i', 'piece-t', 'piece-s', 'piece-o', 'piece-z', 'piece-j', 'piece-l', 'piece-l', 'piece-i']

  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Stack falling blocks. Clear lines.</h2>
          <p>The classic falling-block puzzle with level progression and ghost pieces.</p>
        </div>
        <span className="tag">Arcade</span>
      </div>
      <div className="tetris-preview-grid" aria-hidden="true">
        {blocks.map((cls, i) => (
          <span key={i} className={`tetris-preview-block ${cls}`} />
        ))}
      </div>
      <p className="meta-note">Arrow keys to move and rotate. X to hard-drop. Space to pause.</p>
    </article>
  )
}
```

- [ ] **Step 7: Add Tetris CSS**

Add to `src/index.css` before responsive media queries:
```css
.tetris-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(140px, 0.35fr);
  gap: 18px;
  align-items: start;
}

.tetris-main {
  display: grid;
  gap: 18px;
}

.tetris-side {
  display: grid;
  gap: 12px;
}

.tetris-board {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: rgba(255, 251, 244, 0.78);
}

.tetris-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  background: rgba(238, 228, 213, 0.35);
}

.piece-i { background: #00bcd4; }
.piece-o { background: #ffc107; }
.piece-t { background: #9c27b0; }
.piece-s { background: #4caf50; }
.piece-z { background: #f44336; }
.piece-j { background: #2196f3; }
.piece-l { background: #ff9800; }
.piece-ghost { background: rgba(31, 122, 106, 0.2); border: 1px dashed rgba(31, 122, 106, 0.3); }

.tetris-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.tetris-preview-block {
  display: grid;
  place-items: center;
  min-height: 50px;
  border-radius: 10px;
}
```

- [ ] **Step 8: Register Tetris in registry**

Add imports and entry to `src/games/registry.ts`:
```ts
import { TetrisGame } from './tetris/TetrisGame'
import { TetrisPreview } from './tetris/TetrisPreview'
```

Add entry:
```ts
{
  slug: 'tetris',
  name: 'Tetris',
  genre: 'Arcade',
  status: 'Playable',
  description: 'Stack falling blocks to clear lines. Speed increases as you level up.',
  tags: ['Realtime', 'Keyboard', 'Level progression'],
  highlights: [
    'Seven classic piece types with rotation.',
    'Ghost piece shows landing position.',
    'Level progression with increasing speed.',
  ],
  controls: 'Arrow keys to move and rotate. X to hard-drop. Space to pause.',
  initialMode: 'Classic Tetris with 10-wide board and level progression.',
  expansionPath: 'Hold piece, piece preview queue, and T-spin detection.',
  preview: TetrisPreview,
  playable: TetrisGame,
},
```

- [ ] **Step 9: Add responsive Tetris CSS**

In the `@media (max-width: 960px)` block, add `.tetris-layout` to the single-column list.

- [ ] **Step 10: Lint, build, test, and commit**

```bash
npm run lint && npm test && npm run build
git add -A && git commit -m "feat: add Tetris game with rotation, ghost piece, and level progression"
git push origin main
```

---

### Task 10: Implement Sudoku

**Files:**
- Create: `src/games/sudoku/gameLogic.ts`
- Create: `src/games/sudoku/gameLogic.test.ts`
- Create: `src/games/sudoku/SudokuGame.tsx`
- Create: `src/games/sudoku/SudokuPreview.tsx`
- Modify: `src/games/registry.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write Sudoku game logic tests**

Create `src/games/sudoku/gameLogic.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  generatePuzzle,
  isValidPlacement,
  isSolved,
  getConflicts,
  type SudokuBoard,
} from './gameLogic'

describe('generatePuzzle', () => {
  it('generates a 9x9 board', () => {
    const { puzzle } = generatePuzzle('easy')
    expect(puzzle).toHaveLength(9)
    expect(puzzle.every((row) => row.length === 9)).toBe(true)
  })
  it('has some empty cells (zeros)', () => {
    const { puzzle } = generatePuzzle('easy')
    const zeros = puzzle.flat().filter((v) => v === 0).length
    expect(zeros).toBeGreaterThan(20)
  })
  it('solution has no zeros', () => {
    const { solution } = generatePuzzle('easy')
    expect(solution.flat().every((v) => v > 0)).toBe(true)
  })
  it('solution is valid', () => {
    const { solution } = generatePuzzle('easy')
    expect(isSolved(solution)).toBe(true)
  })
})

describe('isValidPlacement', () => {
  it('returns true for valid placement', () => {
    const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0))
    expect(isValidPlacement(board, 0, 0, 5)).toBe(true)
  })
  it('returns false for row conflict', () => {
    const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0))
    board[0][3] = 5
    expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
  })
  it('returns false for column conflict', () => {
    const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0))
    board[5][0] = 7
    expect(isValidPlacement(board, 0, 0, 7)).toBe(false)
  })
  it('returns false for box conflict', () => {
    const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0))
    board[1][1] = 3
    expect(isValidPlacement(board, 0, 0, 3)).toBe(false)
  })
})

describe('isSolved', () => {
  it('returns false for empty board', () => {
    const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0))
    expect(isSolved(board)).toBe(false)
  })
})

describe('getConflicts', () => {
  it('returns empty set for valid board', () => {
    const { puzzle } = generatePuzzle('easy')
    expect(getConflicts(puzzle).size).toBe(0)
  })
  it('detects row conflicts', () => {
    const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0))
    board[0][0] = 5
    board[0][1] = 5
    const conflicts = getConflicts(board)
    expect(conflicts.has('0,0')).toBe(true)
    expect(conflicts.has('0,1')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/games/sudoku/gameLogic.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement Sudoku game logic**

Create `src/games/sudoku/gameLogic.ts`:
```ts
export type SudokuBoard = number[][]
export type Difficulty = 'easy' | 'medium' | 'hard'

const CLUE_COUNTS: Record<Difficulty, number> = {
  easy: 42,
  medium: 32,
  hard: 25,
}

export function generatePuzzle(difficulty: Difficulty): { puzzle: SudokuBoard; solution: SudokuBoard } {
  const solution = generateSolvedBoard()
  const puzzle = solution.map((row) => [...row])
  const cellsToRemove = 81 - CLUE_COUNTS[difficulty]
  const indices = Array.from({ length: 81 }, (_, i) => i)
  shuffle(indices)
  let removed = 0
  for (const idx of indices) {
    if (removed >= cellsToRemove) break
    const row = Math.floor(idx / 9)
    const col = idx % 9
    puzzle[row][col] = 0
    removed++
  }
  return { puzzle, solution }
}

export function isValidPlacement(board: SudokuBoard, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === num) return false
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === num) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row && c !== col && board[r][c] === num) return false
    }
  }
  return true
}

export function isSolved(board: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false
      if (!isValidPlacement(board, r, c, board[r][c])) return false
    }
  }
  return true
}

export function getConflicts(board: SudokuBoard): Set<string> {
  const conflicts = new Set<string>()
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) continue
      if (!isValidPlacement(board, r, c, board[r][c])) {
        conflicts.add(`${r},${c}`)
      }
    }
  }
  return conflicts
}

function generateSolvedBoard(): SudokuBoard {
  const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0))
  fillBoard(board)
  return board
}

function fillBoard(board: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      shuffle(nums)
      for (const num of nums) {
        if (isValidPlacement(board, r, c, num)) {
          board[r][c] = num
          if (fillBoard(board)) return true
          board[r][c] = 0
        }
      }
      return false
    }
  }
  return true
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/games/sudoku/gameLogic.test.ts
```
Expected: All tests PASS.

- [ ] **Step 5: Create Sudoku game component**

Create `src/games/sudoku/SudokuGame.tsx`:
```tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'
import { useGameTimer } from '../../lib/useGameTimer'
import {
  generatePuzzle,
  getConflicts,
  isSolved,
  type Difficulty,
  type SudokuBoard,
} from './gameLogic'

type PencilMarks = Set<number>[][]

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export function SudokuGame() {
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('sudoku-difficulty', 'easy')
  const [{ puzzle, solution }, setPuzzleData] = useState(() => generatePuzzle(difficulty))
  const [board, setBoard] = useState<SudokuBoard>(() => puzzle.map((r) => [...r]))
  const [pencilMarks, setPencilMarks] = useState<PencilMarks>(() =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>())),
  )
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [pencilMode, setPencilMode] = useState(false)
  const [wins, setWins] = useLocalStorage<number>('sudoku-wins', 0)

  const solved = useMemo(() => isSolved(board), [board])
  const conflicts = useMemo(() => getConflicts(board), [board])
  const { seconds, reset: resetTimer } = useGameTimer(!solved && board.flat().some((v) => v > 0))

  const givenCells = useMemo(() => {
    const set = new Set<string>()
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== 0) set.add(`${r},${c}`)
      }
    }
    return set
  }, [puzzle])

  const startNewGame = useCallback(
    (diff: Difficulty = difficulty) => {
      const data = generatePuzzle(diff)
      setPuzzleData(data)
      setBoard(data.puzzle.map((r) => [...r]))
      setPencilMarks(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>())))
      setSelected(null)
      resetTimer()
    },
    [difficulty, resetTimer],
  )

  useKeyboardShortcut('r', () => startNewGame())

  function handleCellClick(row: number, col: number) {
    setSelected([row, col])
  }

  function handleNumberInput(num: number) {
    if (!selected) return
    const [r, c] = selected
    if (givenCells.has(`${r},${c}`)) return

    if (pencilMode) {
      setPencilMarks((prev) => {
        const next = prev.map((row) => row.map((s) => new Set(s)))
        if (next[r][c].has(num)) {
          next[r][c].delete(num)
        } else {
          next[r][c].add(num)
        }
        return next
      })
    } else {
      setBoard((prev) => {
        const next = prev.map((row) => [...row])
        next[r][c] = prev[r][c] === num ? 0 : num
        return next
      })
      setPencilMarks((prev) => {
        const next = prev.map((row) => row.map((s) => new Set(s)))
        next[r][c].clear()
        return next
      })
    }
  }

  function handleClear() {
    if (!selected) return
    const [r, c] = selected
    if (givenCells.has(`${r},${c}`)) return
    setBoard((prev) => {
      const next = prev.map((row) => [...row])
      next[r][c] = 0
      return next
    })
    setPencilMarks((prev) => {
      const next = prev.map((row) => row.map((s) => new Set(s)))
      next[r][c].clear()
      return next
    })
  }

  useEffect(() => {
    if (solved) setWins((w) => w + 1)
  }, [solved, setWins])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!selected) return
      const [r, c] = selected
      const num = parseInt(e.key)
      if (num >= 1 && num <= 9) {
        e.preventDefault()
        handleNumberInput(num)
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        handleClear()
        return
      }
      if (e.key === 'ArrowUp' && r > 0) setSelected([r - 1, c])
      if (e.key === 'ArrowDown' && r < 8) setSelected([r + 1, c])
      if (e.key === 'ArrowLeft' && c > 0) setSelected([r, c - 1])
      if (e.key === 'ArrowRight' && c < 8) setSelected([r, c + 1])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  function handleDifficultyChange(diff: Difficulty) {
    setDifficulty(diff)
    startNewGame(diff)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const statusMessage = solved
    ? `Solved in ${formatTime(seconds)}! Press R for a new puzzle.`
    : `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} puzzle. Use arrow keys to navigate, number keys to fill.`

  return (
    <article className="game-preview-card playable-card">
      <div className="play-header">
        <h2>Sudoku</h2>
        <div className="action-row">
          <button className="ghost-button" onClick={() => startNewGame()}>New Puzzle</button>
        </div>
      </div>

      <div className="mode-switch difficulty-switch">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <button
            key={d}
            className={`segment-button${difficulty === d ? ' active' : ''}`}
            onClick={() => handleDifficultyChange(d)}
          >
            {difficultyLabels[d]}
          </button>
        ))}
      </div>

      <div className="sudoku-layout">
        <div className="sudoku-main">
          <div className="sudoku-board">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isGiven = givenCells.has(`${r},${c}`)
                const isSelected = selected?.[0] === r && selected?.[1] === c
                const hasConflict = conflicts.has(`${r},${c}`) && !isGiven
                const marks = pencilMarks[r][c]
                return (
                  <button
                    key={`${r}-${c}`}
                    className={[
                      'sudoku-cell',
                      isGiven ? 'sudoku-given' : '',
                      isSelected ? 'sudoku-selected' : '',
                      hasConflict ? 'sudoku-conflict' : '',
                      c === 2 || c === 5 ? 'sudoku-border-right' : '',
                      r === 2 || r === 5 ? 'sudoku-border-bottom' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleCellClick(r, c)}
                    disabled={solved}
                  >
                    {cell > 0 ? (
                      cell
                    ) : marks.size > 0 ? (
                      <span className="sudoku-pencil">
                        {Array.from(marks).sort().join('')}
                      </span>
                    ) : (
                      ''
                    )}
                  </button>
                )
              }),
            )}
          </div>
        </div>

        <div className="sudoku-side">
          <div className="sudoku-numpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} className="ghost-button" onClick={() => handleNumberInput(n)}>
                {n}
              </button>
            ))}
            <button className="ghost-button" onClick={handleClear}>Clear</button>
          </div>

          <button
            className={`ghost-button${pencilMode ? ' active-pencil' : ''}`}
            onClick={() => setPencilMode((p) => !p)}
          >
            {pencilMode ? 'Pencil ON' : 'Pencil OFF'}
          </button>

          <div className="score-card">
            <span className="score-label">Time</span>
            <strong>{formatTime(seconds)}</strong>
          </div>
          <div className="score-card">
            <span className="score-label">Wins</span>
            <strong>{wins}</strong>
          </div>
        </div>
      </div>

      <div className="status-panel" aria-live="polite">
        <span>{statusMessage}</span>
      </div>
    </article>
  )
}
```

- [ ] **Step 6: Create Sudoku preview**

Create `src/games/sudoku/SudokuPreview.tsx`:
```tsx
const cells = [5, 3, 0, 0, 7, 0, 0, 0, 0]

export function SudokuPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Fill the grid with logic alone.</h2>
          <p>Classic 9x9 Sudoku with three difficulty levels and pencil marks.</p>
        </div>
        <span className="tag">Puzzle</span>
      </div>
      <div className="sudoku-preview-grid" aria-hidden="true">
        {cells.map((v, i) => (
          <span key={i} className={`sudoku-preview-cell${v ? ' sudoku-given' : ''}`}>
            {v || ''}
          </span>
        ))}
      </div>
      <p className="meta-note">Click a cell, then type a number. Arrow keys to navigate. Three difficulty levels.</p>
    </article>
  )
}
```

- [ ] **Step 7: Add Sudoku CSS**

Add to `src/index.css` before the responsive media queries:
```css
.sudoku-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(140px, 0.35fr);
  gap: 18px;
  align-items: start;
}

.sudoku-main {
  display: grid;
  gap: 18px;
}

.sudoku-side {
  display: grid;
  gap: 12px;
}

.sudoku-board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 3px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: rgba(255, 251, 244, 0.78);
}

.sudoku-cell {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-weight: 700;
  font-size: clamp(1rem, 2.5vw, 1.4rem);
  background: rgba(255, 252, 247, 0.92);
  color: var(--accent-strong);
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
  padding: 0;
}

.sudoku-cell:hover:not(:disabled) {
  border-color: rgba(31, 122, 106, 0.3);
}

.sudoku-given {
  color: var(--heading);
  font-weight: 800;
}

.sudoku-selected {
  border-color: var(--accent);
  background: rgba(31, 122, 106, 0.1);
  box-shadow: 0 0 0 2px rgba(31, 122, 106, 0.2);
}

.sudoku-conflict {
  color: var(--danger);
  background: rgba(181, 84, 72, 0.08);
}

.sudoku-border-right {
  border-right: 2px solid var(--border-strong);
}

.sudoku-border-bottom {
  border-bottom: 2px solid var(--border-strong);
}

.sudoku-pencil {
  font-size: 0.55rem;
  line-height: 1.2;
  color: var(--text-soft);
  word-break: break-all;
}

.sudoku-numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.active-pencil {
  background: var(--accent-soft);
  border-color: rgba(31, 122, 106, 0.24);
  color: var(--accent-strong);
}

.sudoku-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.sudoku-preview-cell {
  display: grid;
  place-items: center;
  min-height: 60px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255, 252, 246, 0.82);
  font-weight: 700;
  font-size: 1.3rem;
  color: var(--text-soft);
}

.sudoku-preview-cell.sudoku-given {
  color: var(--heading);
}
```

- [ ] **Step 8: Register Sudoku in registry**

Add imports and entry to `src/games/registry.ts`:
```ts
import { SudokuGame } from './sudoku/SudokuGame'
import { SudokuPreview } from './sudoku/SudokuPreview'
```

Add entry:
```ts
{
  slug: 'sudoku',
  name: 'Sudoku',
  genre: 'Puzzle',
  status: 'Playable',
  description: 'Fill the 9x9 grid so every row, column, and 3x3 box contains 1-9. Three difficulty levels.',
  tags: ['Logic', 'Keyboard', 'Pencil marks'],
  highlights: [
    'Backtracking puzzle generator with easy, medium, and hard modes.',
    'Pencil mark support for candidate tracking.',
    'Conflict highlighting and timer.',
  ],
  controls: 'Click a cell, then type a number. Arrow keys to navigate.',
  initialMode: 'Easy difficulty with timer and pencil marks.',
  expansionPath: 'Hints, undo, and puzzle rating.',
  preview: SudokuPreview,
  playable: SudokuGame,
},
```

- [ ] **Step 9: Add responsive Sudoku CSS**

In the `@media (max-width: 960px)` block, add `.sudoku-layout` to the single-column list.

- [ ] **Step 10: Lint, build, test, and commit**

```bash
npm run lint && npm test && npm run build
git add -A && git commit -m "feat: add Sudoku game with generator, pencil marks, and difficulty levels"
git push origin main
```

---

## Phase 3: Finalize

### Task 11: Update documentation and home page

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/game-roadmap.md`
- Modify: `src/app/pages/HomePage.tsx`

- [ ] **Step 1: Update HomePage stat count**

In `src/app/pages/HomePage.tsx`, update the game count stat from `4` to `9`.

- [ ] **Step 2: Update README.md**

Update the game list, feature list, and project structure in README.md to reflect all 9 games, Vitest, dark mode, shared hooks, and new game directories.

- [ ] **Step 3: Update AGENTS.md**

Update the delivery plan and current status sections to list all 9 games and the new shared infrastructure.

- [ ] **Step 4: Update game-roadmap.md**

Add sections for 2048, Snake, Wordle, Tetris, and Sudoku with future improvement ideas.

- [ ] **Step 5: Lint, build, test, and commit**

```bash
npm run lint && npm test && npm run build
git add -A && git commit -m "docs: update documentation for all 9 games and new infrastructure"
git push origin main
```
