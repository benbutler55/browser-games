import { useCallback, useEffect, useRef, useState } from 'react'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  createBoard,
  spawnPiece,
  movePiece,
  rotatePiece,
  hasCollision,
  lockPiece,
  clearLines,
  getRandomPiece,
  getGhostY,
  calculateScore,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  type TetrisBoard,
  type Piece,
} from './gameLogic'

const COLOR_CLASSES = ['', 'piece-i', 'piece-o', 'piece-t', 'piece-s', 'piece-z', 'piece-j', 'piece-l']

function tryWallKick(board: TetrisBoard, piece: Piece): Piece | null {
  const rotated = rotatePiece(piece)
  const offsets = [0, -1, 1, -2, 2]
  for (const dx of offsets) {
    const kicked = movePiece(rotated, dx, 0)
    if (!hasCollision(board, kicked)) return kicked
  }
  return null
}

export function TetrisGame() {
  const [board, setBoard] = useState<TetrisBoard>(createBoard)
  const [piece, setPiece] = useState<Piece>(() => spawnPiece(getRandomPiece()))
  const [nextType, setNextType] = useState(getRandomPiece)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  const [highScore, setHighScore] = useLocalStorage('tetris-high-score', 0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const level = Math.floor(lines / 10)
  const speed = Math.max(100, 800 - level * 70)

  const spawnNext = useCallback(
    (currentBoard: TetrisBoard) => {
      const newPiece = spawnPiece(nextType)
      if (hasCollision(currentBoard, newPiece)) {
        setGameOver(true)
        return
      }
      setPiece(newPiece)
      setNextType(getRandomPiece())
    },
    [nextType],
  )

  const lockAndClear = useCallback(
    (currentBoard: TetrisBoard, currentPiece: Piece) => {
      const locked = lockPiece(currentBoard, currentPiece)
      const { board: cleared, linesCleared } = clearLines(locked)
      setBoard(cleared)
      if (linesCleared > 0) {
        const points = calculateScore(linesCleared, level)
        setScore((s) => {
          const newScore = s + points
          return newScore
        })
        setLines((l) => l + linesCleared)
      }
      spawnNext(cleared)
    },
    [level, spawnNext],
  )

  const restart = useCallback(() => {
    const newBoard = createBoard()
    setBoard(newBoard)
    const newPiece = spawnPiece(getRandomPiece())
    setPiece(newPiece)
    setNextType(getRandomPiece())
    setScore(0)
    setLines(0)
    setGameOver(false)
    setPaused(false)
  }, [])

  useKeyboardShortcut('r', restart)

  // Track high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
    }
  }, [score, highScore, setHighScore])

  // Game tick — gravity
  useEffect(() => {
    if (gameOver || paused) return

    tickRef.current = setInterval(() => {
      setPiece((prev) => {
        const dropped = movePiece(prev, 0, 1)
        if (!hasCollision(board, dropped)) {
          return dropped
        }
        // Lock on next tick — schedule lock
        setTimeout(() => lockAndClear(board, prev), 0)
        return prev
      })
    }, speed)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [board, gameOver, paused, speed, lockAndClear])

  // Keyboard input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (gameOver) return

      if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
        return
      }

      if (paused) return

      switch (e.key) {
        case 'ArrowLeft': {
          e.preventDefault()
          setPiece((prev) => {
            const moved = movePiece(prev, -1, 0)
            return hasCollision(board, moved) ? prev : moved
          })
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          setPiece((prev) => {
            const moved = movePiece(prev, 1, 0)
            return hasCollision(board, moved) ? prev : moved
          })
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          setPiece((prev) => {
            const moved = movePiece(prev, 0, 1)
            return hasCollision(board, moved) ? prev : moved
          })
          break
        }
        case 'ArrowUp':
        case 'z':
        case 'Z': {
          e.preventDefault()
          setPiece((prev) => {
            const kicked = tryWallKick(board, prev)
            return kicked ?? prev
          })
          break
        }
        case 'x':
        case 'X': {
          e.preventDefault()
          setPiece((prev) => {
            const ghostY = getGhostY(board, prev)
            const hardDropped = { ...prev, y: ghostY }
            setTimeout(() => lockAndClear(board, hardDropped), 0)
            return hardDropped
          })
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [board, gameOver, paused, lockAndClear])

  // Build rendered board with piece and ghost
  const ghostY = getGhostY(board, piece)
  const displayBoard = board.map((row) => [...row])

  // Draw ghost piece
  if (!gameOver) {
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const bx = piece.x + col
          const by = ghostY + row
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH && displayBoard[by][bx] === 0) {
            displayBoard[by][bx] = -1 // ghost marker
          }
        }
      }
    }
  }

  // Draw current piece
  if (!gameOver) {
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const bx = piece.x + col
          const by = piece.y + row
          if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
            const colorMap: Record<string, number> = { I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 }
            displayBoard[by][bx] = colorMap[piece.type]
          }
        }
      }
    }
  }

  const cells: React.JSX.Element[] = []
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const val = displayBoard[y][x]
      let className = 'tetris-cell'
      if (val === -1) {
        className = 'tetris-cell piece-ghost'
      } else if (val > 0) {
        className = `tetris-cell ${COLOR_CLASSES[val]}`
      }
      cells.push(<div key={`${x},${y}`} className={className} />)
    }
  }

  // Next piece preview
  const nextShape = spawnPiece(nextType).shape
  const nextPreviewCells: React.JSX.Element[] = []
  const colorMap: Record<string, number> = { I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 }
  const previewSize = nextShape.length
  for (let y = 0; y < previewSize; y++) {
    for (let x = 0; x < previewSize; x++) {
      const val = nextShape[y]?.[x]
      let className = 'tetris-cell'
      if (val) {
        className = `tetris-cell ${COLOR_CLASSES[colorMap[nextType]]}`
      }
      nextPreviewCells.push(<div key={`next-${x}-${y}`} className={className} />)
    }
  }

  const statusText = gameOver ? 'Game over' : paused ? 'Paused' : ''

  return (
    <div className="tetris-layout">
      <div className="tetris-main">
        <div className="tetris-board">{cells}</div>

        {statusText && (
          <p className="status-banner" role="status" aria-live="polite">
            {statusText}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!gameOver && (
            <button className="btn" onClick={() => setPaused((p) => !p)}>
              {paused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button className="btn" onClick={restart}>
            New game
          </button>
        </div>
      </div>

      <div className="tetris-side">
        <div className="stat-card">
          <span className="stat-label">Score</span>
          <span className="stat-value">{score}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Lines</span>
          <span className="stat-value">{lines}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Level</span>
          <span className="stat-value">{level}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Best</span>
          <span className="stat-value">{highScore}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Next</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${previewSize}, 24px)`,
              gap: '2px',
              marginTop: '8px',
            }}
          >
            {nextPreviewCells}
          </div>
        </div>
      </div>

      <div className="details-grid">
        <article className="game-detail">
          <strong>How to play</strong>
          <ul className="rule-list">
            <li>Move falling pieces left and right with arrow keys.</li>
            <li>Rotate pieces with Up arrow or Z. Hard-drop with X.</li>
            <li>Complete a full horizontal row to clear it and earn points.</li>
            <li>The game ends when new pieces can no longer fit on the board.</li>
          </ul>
        </article>

        <article className="game-detail">
          <strong>Tips</strong>
          <ul className="rule-list">
            <li>Keep the board flat — avoid leaving deep gaps in one column.</li>
            <li>The ghost piece shows where your block will land. Use it to plan drops.</li>
            <li>Speed increases every 10 lines. Clearing four lines at once scores the most.</li>
            <li>Press Space to pause and R to restart.</li>
          </ul>
        </article>
      </div>
    </div>
  )
}
