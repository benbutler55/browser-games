import { useCallback, useEffect, useRef, useState } from 'react'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  advanceState,
  changeDirection,
  createInitialState,
  type Direction,
  type SnakeState,
} from './gameLogic'

const GRID_WIDTH = 20
const GRID_HEIGHT = 20
const TICK_MS = 120

export function SnakeGame() {
  const [state, setState] = useState<SnakeState>(() =>
    createInitialState(GRID_WIDTH, GRID_HEIGHT),
  )
  const [paused, setPaused] = useState(false)
  const [highScore, setHighScore] = useLocalStorage('snake-high-score', 0)
  const directionQueue = useRef<Direction[]>([])
  const boardRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const restart = useCallback(() => {
    setState(createInitialState(GRID_WIDTH, GRID_HEIGHT))
    setPaused(false)
    directionQueue.current = []
  }, [])

  useKeyboardShortcut('r', restart)

  // Game tick
  useEffect(() => {
    if (state.gameOver || paused) return

    const id = setInterval(() => {
      setState((prev) => {
        let current = prev
        // Process direction queue
        while (directionQueue.current.length > 0) {
          const dir = directionQueue.current.shift()!
          current = changeDirection(current, dir)
        }
        const next = advanceState(current)
        return next
      })
    }, TICK_MS)

    return () => clearInterval(id)
  }, [state.gameOver, paused])

  // Track high score
  useEffect(() => {
    if (state.score > highScore) {
      setHighScore(state.score)
    }
  }, [state.score, highScore, setHighScore])

  // Keyboard input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        W: 'up',
        s: 'down',
        S: 'down',
        a: 'left',
        A: 'left',
        d: 'right',
        D: 'right',
      }

      if (e.key === ' ') {
        e.preventDefault()
        if (!state.gameOver) {
          setPaused((p) => !p)
        }
        return
      }

      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        directionQueue.current.push(dir)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.gameOver])

  // Swipe support
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

    let dir: Direction
    if (absDx > absDy) {
      dir = dx > 0 ? 'right' : 'left'
    } else {
      dir = dy > 0 ? 'down' : 'up'
    }
    directionQueue.current.push(dir)
  }

  // Build cell lookup
  const snakeSet = new Map<string, 'head' | 'body'>()
  state.snake.forEach((p, i) => {
    snakeSet.set(`${p.x},${p.y}`, i === 0 ? 'head' : 'body')
  })
  const foodKey = `${state.food.x},${state.food.y}`

  const cells: React.JSX.Element[] = []
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const key = `${x},${y}`
      let className = 'snake-cell'
      const part = snakeSet.get(key)
      if (part === 'head') className = 'snake-cell snake-head'
      else if (part === 'body') className = 'snake-cell snake-body'
      else if (key === foodKey) className = 'snake-cell snake-food'
      cells.push(<div key={key} className={className} />)
    }
  }

  const statusText = state.gameOver ? 'Game over' : paused ? 'Paused' : ''

  return (
    <div className="snake-layout">
      <div className="snake-main">
        <div className="twenty48-score-row">
          <div className="stat-card">
            <span className="stat-label">Score</span>
            <span className="stat-value">{state.score}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Best</span>
            <span className="stat-value">{highScore}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Length</span>
            <span className="stat-value">{state.snake.length}</span>
          </div>
        </div>

        <div
          className="snake-board"
          ref={boardRef}
          style={{
            gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {cells}
        </div>

        {statusText && (
          <p className="status-banner" role="status" aria-live="polite">
            {statusText}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!state.gameOver && (
            <button className="btn" onClick={() => setPaused((p) => !p)}>
              {paused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button className="btn" onClick={restart}>
            New game
          </button>
        </div>
      </div>
    </div>
  )
}
