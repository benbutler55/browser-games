import { useCallback, useEffect, useState } from 'react'
import { useGameTimer } from '../../lib/useGameTimer'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  generatePuzzle,
  getConflicts,
  isSolved,
  type Difficulty,
  type SudokuBoard,
} from './gameLogic'

type Phase = 'playing' | 'won'

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function SudokuGame() {
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('sudoku-difficulty', 'easy')
  const [wins, setWins] = useLocalStorage('sudoku-wins', 0)
  const [board, setBoard] = useState<SudokuBoard>(() => generatePuzzle(difficulty).puzzle)
  const [given, setGiven] = useState<boolean[][]>(() => [])
  const [pencilMarks, setPencilMarks] = useState<Set<number>[][]>(() =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())),
  )
  const [pencilMode, setPencilMode] = useState(false)
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [phase, setPhase] = useState<Phase>('playing')
  const { seconds, reset: resetTimer } = useGameTimer(phase === 'playing')

  const conflicts = getConflicts(board)

  const startNewGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff ?? difficulty
      const { puzzle } = generatePuzzle(d)
      setBoard(puzzle)
      setGiven(puzzle.map((row) => row.map((v) => v !== 0)))
      setPencilMarks(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())))
      setPencilMode(false)
      setSelected(null)
      setPhase('playing')
      resetTimer()
    },
    [difficulty, resetTimer],
  )

  // Initialize on mount
  useEffect(() => {
    startNewGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useKeyboardShortcut('r', () => startNewGame())

  function handleDifficultyChange(d: Difficulty) {
    setDifficulty(d)
    startNewGame(d)
  }

  function placeNumber(num: number) {
    if (!selected || phase === 'won') return
    const [r, c] = selected
    if (given[r]?.[c]) return

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
      return
    }

    const newBoard = board.map((row) => [...row])
    newBoard[r][c] = num
    setBoard(newBoard)

    // Clear pencil marks for this cell
    setPencilMarks((prev) => {
      const next = prev.map((row) => row.map((s) => new Set(s)))
      next[r][c].clear()
      return next
    })

    if (isSolved(newBoard)) {
      setPhase('won')
      setWins((w) => w + 1)
    }
  }

  function clearCell() {
    if (!selected || phase === 'won') return
    const [r, c] = selected
    if (given[r]?.[c]) return

    const newBoard = board.map((row) => [...row])
    newBoard[r][c] = 0
    setBoard(newBoard)

    setPencilMarks((prev) => {
      const next = prev.map((row) => row.map((s) => new Set(s)))
      next[r][c].clear()
      return next
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!selected) return
    const [r, c] = selected

    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault()
      placeNumber(parseInt(e.key))
      return
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      clearCell()
      return
    }

    if (e.key === 'ArrowUp' && r > 0) {
      e.preventDefault()
      setSelected([r - 1, c])
    } else if (e.key === 'ArrowDown' && r < 8) {
      e.preventDefault()
      setSelected([r + 1, c])
    } else if (e.key === 'ArrowLeft' && c > 0) {
      e.preventDefault()
      setSelected([r, c - 1])
    } else if (e.key === 'ArrowRight' && c < 8) {
      e.preventDefault()
      setSelected([r, c + 1])
    }
  }

  function cellClasses(r: number, c: number): string {
    const classes = ['sudoku-cell']
    if (given[r]?.[c]) classes.push('sudoku-given')
    if (selected && selected[0] === r && selected[1] === c) classes.push('sudoku-selected')
    if (board[r][c] !== 0 && conflicts.has(`${r},${c}`)) classes.push('sudoku-conflict')
    if (c === 2 || c === 5) classes.push('sudoku-border-right')
    if (r === 2 || r === 5) classes.push('sudoku-border-bottom')
    return classes.join(' ')
  }

  return (
    <div className="sudoku-layout" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="sudoku-main">
        <div className="segment-group" role="radiogroup" aria-label="Difficulty">
          {(Object.keys(difficultyLabels) as Difficulty[]).map((d) => (
            <button
              key={d}
              className={`segment-btn${d === difficulty ? ' active' : ''}`}
              onClick={() => handleDifficultyChange(d)}
              role="radio"
              aria-checked={d === difficulty}
            >
              {difficultyLabels[d]}
            </button>
          ))}
        </div>

        <div className="sudoku-board" role="grid" aria-label="Sudoku board">
          {board.map((row, r) =>
            row.map((val, c) => (
              <button
                key={`${r}-${c}`}
                className={cellClasses(r, c)}
                onClick={() => setSelected([r, c])}
                aria-label={`Row ${r + 1}, Column ${c + 1}${val ? `, value ${val}` : ', empty'}`}
              >
                {val !== 0 ? (
                  val
                ) : pencilMarks[r]?.[c]?.size ? (
                  <span className="sudoku-pencil">
                    {Array.from(pencilMarks[r][c])
                      .sort()
                      .join('')}
                  </span>
                ) : (
                  ''
                )}
              </button>
            )),
          )}
        </div>

        {phase === 'won' && (
          <p className="status-message" role="status">
            Puzzle solved in {formatTime(seconds)}!
          </p>
        )}
      </div>

      <div className="sudoku-side">
        <div className="stat-panel">
          <span className="stat-label">Time</span>
          <span className="stat-value">{formatTime(seconds)}</span>
        </div>
        <div className="stat-panel">
          <span className="stat-label">Wins</span>
          <span className="stat-value">{wins}</span>
        </div>
        <div className="stat-panel">
          <span className="stat-label">Difficulty</span>
          <span className="stat-value">{difficultyLabels[difficulty]}</span>
        </div>

        <button
          className={`action-btn${pencilMode ? ' active-pencil' : ''}`}
          onClick={() => setPencilMode((p) => !p)}
        >
          {pencilMode ? 'Pencil: On' : 'Pencil: Off'}
        </button>

        <div className="sudoku-numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} className="action-btn" onClick={() => placeNumber(n)}>
              {n}
            </button>
          ))}
        </div>

        <button className="action-btn" onClick={() => clearCell()}>
          Clear
        </button>

        <button className="action-btn" onClick={() => startNewGame()}>
          New game <kbd>R</kbd>
        </button>
      </div>
    </div>
  )
}
