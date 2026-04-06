import { useCallback, useEffect, useRef, useState } from 'react'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  addRandomTile,
  createInitialBoard,
  getBestTile,
  hasAvailableMove,
  move,
  type Board,
  type Direction,
} from './gameLogic'

const MAX_HISTORY = 20

function tileClass(value: number): string {
  if (value === 0) return 'twenty48-cell'
  return `twenty48-cell tile-${value}`
}

export function TwentyFortyEightGame() {
  const [board, setBoard] = useState<Board>(createInitialBoard)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useLocalStorage('twenty48-best-score', 0)
  const [bestTile, setBestTile] = useLocalStorage('twenty48-best-tile', 0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [keepPlaying, setKeepPlaying] = useState(false)
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([])
  const boardRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleNewGame = useCallback(() => {
    setBoard(createInitialBoard())
    setScore(0)
    setGameOver(false)
    setWon(false)
    setKeepPlaying(false)
    setHistory([])
  }, [])

  useKeyboardShortcut('r', handleNewGame)

  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameOver) return
      if (won && !keepPlaying) return

      const result = move(board, direction)
      if (!result.changed) return

      const newBoard = addRandomTile(result.board)
      const newScore = score + result.score

      setHistory((prev) => {
        const next = [...prev, { board, score }]
        if (next.length > MAX_HISTORY) next.shift()
        return next
      })

      setBoard(newBoard)
      setScore(newScore)

      if (newScore > bestScore) setBestScore(newScore)

      const tile = getBestTile(newBoard)
      if (tile > bestTile) setBestTile(tile)

      if (tile >= 2048 && !won && !keepPlaying) {
        setWon(true)
      }

      if (!hasAvailableMove(newBoard)) {
        setGameOver(true)
      }
    },
    [board, score, gameOver, won, keepPlaying, bestScore, bestTile, setBestScore, setBestTile],
  )

  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setBoard(prev.board)
    setScore(prev.score)
    setHistory((h) => h.slice(0, -1))
    setGameOver(false)
  }, [history])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleMove])

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStart.current.x
    const dy = touch.clientY - touchStart.current.y
    touchStart.current = null

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const threshold = 30

    if (absDx < threshold && absDy < threshold) return

    if (absDx > absDy) {
      handleMove(dx > 0 ? 'right' : 'left')
    } else {
      handleMove(dy > 0 ? 'down' : 'up')
    }
  }

  const statusText = gameOver ? 'Game over' : won && !keepPlaying ? 'You win!' : ''

  return (
    <div className="twenty48-layout">
      <div className="twenty48-main">
        <div className="twenty48-score-row">
          <div className="stat-card">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Best</span>
            <span className="stat-value">{bestScore}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Best tile</span>
            <span className="stat-value">{bestTile}</span>
          </div>
        </div>

        <div
          className="twenty48-board"
          ref={boardRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {board.flat().map((value, i) => (
            <div key={i} className={tileClass(value)}>
              {value > 0 ? value : ''}
            </div>
          ))}
        </div>

        {statusText && (
          <p className="status-banner" role="status" aria-live="polite">
            {statusText}
          </p>
        )}

        {won && !keepPlaying && (
          <button className="btn" onClick={() => setKeepPlaying(true)}>
            Keep playing
          </button>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={handleNewGame}>
            New game
          </button>
          <button className="btn" onClick={handleUndo} disabled={history.length === 0}>
            Undo
          </button>
        </div>
      </div>

      <div className="details-grid">
        <article className="game-detail">
          <strong>How to play</strong>
          <ul className="rule-list">
            <li>Use arrow keys or swipe to slide all tiles in one direction.</li>
            <li>When two tiles with the same number collide, they merge into one.</li>
            <li>A new tile (2 or 4) appears after each move.</li>
            <li>Reach the 2048 tile to win, then keep going for a higher score.</li>
          </ul>
        </article>

        <article className="game-detail">
          <strong>Tips</strong>
          <ul className="rule-list">
            <li>Keep your highest tile in a corner and build around it.</li>
            <li>Avoid pushing tiles into the center where they get trapped.</li>
            <li>Use undo to recover from a bad move — up to 20 moves of history are saved.</li>
            <li>Press R to start a new game at any time.</li>
          </ul>
        </article>
      </div>
    </div>
  )
}
