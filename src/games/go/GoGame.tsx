import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  createInitialState,
  placeStone,
  pass,
  getTerritory,
  calculateScore,
  BOARD_SIZE,
  type GoState,
  type StoneColor,
  type Cell,
} from './gameLogic'
import { getBestMove, type Difficulty } from './goAi'

type GameMode = 'local' | 'computer'

type Scoreboard = {
  black: number
  white: number
}

const defaultScores: Scoreboard = { black: 0, white: 0 }

const modeLabels: Record<GameMode, string> = {
  local: 'Two players',
  computer: 'Vs computer',
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const PADDING = 30
const CELL_SIZE = 40
const SVG_SIZE = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2

/** Standard star point (hoshi) positions for a 9x9 board */
const HOSHI_POINTS: [number, number][] = [
  [2, 2],
  [2, 6],
  [4, 4],
  [6, 2],
  [6, 6],
]

export function GoGame() {
  const [mode, setMode] = useLocalStorage<GameMode>('go-mode', 'local')
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('go-difficulty', 'medium')
  const [scores, setScores] = useLocalStorage<Scoreboard>('go-scores', defaultScores)
  const [gameState, setGameState] = useState<GoState>(() => createInitialState())
  const [resultRecorded, setResultRecorded] = useState(false)

  const territory = useMemo(
    () => (gameState.gameOver ? getTerritory(gameState.board) : null),
    [gameState.board, gameState.gameOver],
  )

  const finalScore = useMemo(
    () => (gameState.gameOver ? calculateScore(gameState.board) : null),
    [gameState.board, gameState.gameOver],
  )

  const isRoundOver = gameState.gameOver
  const isAiTurn = mode === 'computer' && gameState.turn === 'white' && !isRoundOver

  const lastMove =
    gameState.moveHistory.length > 0
      ? gameState.moveHistory[gameState.moveHistory.length - 1]
      : null

  const recordResult = useCallback(
    (winner: StoneColor) => {
      setScores((s) => ({
        ...s,
        [winner]: s[winner] + 1,
      }))
    },
    [setScores],
  )

  // Record result when game ends
  useEffect(() => {
    if (isRoundOver && finalScore && !resultRecorded) {
      const winner: StoneColor = finalScore.black > finalScore.white ? 'black' : 'white'
      recordResult(winner)
      setResultRecorded(true)
    }
  }, [isRoundOver, finalScore, resultRecorded, recordResult])

  // AI move effect
  useEffect(() => {
    if (!isAiTurn) return

    const timer = window.setTimeout(() => {
      const move = getBestMove(gameState, difficulty)
      if (move === 'pass') {
        setGameState((s) => pass(s))
      } else {
        const result = placeStone(gameState, move)
        if (result) {
          setGameState(result)
        } else {
          // Fallback to pass if move is invalid
          setGameState((s) => pass(s))
        }
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [gameState, difficulty, isAiTurn])

  function handleIntersectionClick(row: number, col: number) {
    if (isRoundOver || isAiTurn) return

    const result = placeStone(gameState, [row, col])
    if (result) {
      setGameState(result)
    }
  }

  function handlePass() {
    if (isRoundOver || isAiTurn) return
    setGameState((s) => pass(s))
  }

  function handleResign() {
    if (isRoundOver) return
    // The current player resigns, so the opponent wins
    const winner = gameState.turn === 'black' ? 'white' : 'black'
    recordResult(winner)
    setResultRecorded(true)
    setGameState((s) => ({ ...s, gameOver: true }))
  }

  function handleModeChange(nextMode: GameMode) {
    if (nextMode === mode) return
    setMode(nextMode)
    setScores(defaultScores)
    setGameState(createInitialState())
    setResultRecorded(false)
  }

  function handleNewGame() {
    setGameState(createInitialState())
    setResultRecorded(false)
  }

  function handleResetScores() {
    setScores(defaultScores)
    handleNewGame()
  }

  const statusMessage = isRoundOver
    ? finalScore
      ? finalScore.black > finalScore.white
        ? `Black wins ${finalScore.black} to ${finalScore.white}.`
        : `White wins ${finalScore.white} to ${finalScore.black}.`
      : `Game over. ${gameState.turn === 'black' ? 'White' : 'Black'} wins by resignation.`
    : isAiTurn
      ? 'Computer is thinking...'
      : `${gameState.turn === 'black' ? 'Black' : 'White'} to move.`

  function toSvgX(col: number) {
    return PADDING + col * CELL_SIZE
  }

  function toSvgY(row: number) {
    return PADDING + row * CELL_SIZE
  }

  function renderGridLines() {
    const lines: React.JSX.Element[] = []

    // Horizontal lines
    for (let r = 0; r < BOARD_SIZE; r++) {
      lines.push(
        <line
          key={`h-${r}`}
          x1={toSvgX(0)}
          y1={toSvgY(r)}
          x2={toSvgX(BOARD_SIZE - 1)}
          y2={toSvgY(r)}
          stroke="#333"
          strokeWidth={0.8}
        />,
      )
    }

    // Vertical lines
    for (let c = 0; c < BOARD_SIZE; c++) {
      lines.push(
        <line
          key={`v-${c}`}
          x1={toSvgX(c)}
          y1={toSvgY(0)}
          x2={toSvgX(c)}
          y2={toSvgY(BOARD_SIZE - 1)}
          stroke="#333"
          strokeWidth={0.8}
        />,
      )
    }

    return lines
  }

  function renderHoshi() {
    return HOSHI_POINTS.map(([r, c]) => (
      <circle
        key={`hoshi-${r}-${c}`}
        cx={toSvgX(c)}
        cy={toSvgY(r)}
        r={3}
        fill="#333"
      />
    ))
  }

  function renderStones() {
    const stones: React.JSX.Element[] = []

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = gameState.board[r][c]
        if (!cell) continue

        const cx = toSvgX(c)
        const cy = toSvgY(r)
        const isBlack = cell === 'black'

        stones.push(
          <circle
            key={`stone-${r}-${c}`}
            cx={cx}
            cy={cy}
            r={CELL_SIZE * 0.44}
            fill={isBlack ? '#111' : '#eee'}
            stroke={isBlack ? '#333' : '#999'}
            strokeWidth={1.2}
          />,
        )

        // Last move indicator
        if (lastMove && lastMove[0] === r && lastMove[1] === c) {
          stones.push(
            <circle
              key={`last-${r}-${c}`}
              cx={cx}
              cy={cy}
              r={4}
              fill={isBlack ? '#eee' : '#333'}
            />,
          )
        }
      }
    }

    return stones
  }

  function renderTerritory() {
    if (!territory) return null

    const markers: React.JSX.Element[] = []
    const size = CELL_SIZE * 0.22

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const owner: Cell = territory[r][c]
        if (!owner) continue

        markers.push(
          <rect
            key={`territory-${r}-${c}`}
            x={toSvgX(c) - size}
            y={toSvgY(r) - size}
            width={size * 2}
            height={size * 2}
            fill={owner === 'black' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.55)'}
            rx={2}
          />,
        )
      }
    }

    return markers
  }

  function renderClickTargets() {
    if (isRoundOver || isAiTurn) return null

    const targets: React.JSX.Element[] = []

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (gameState.board[r][c] !== null) continue

        targets.push(
          <circle
            key={`click-${r}-${c}`}
            className="go-click-target"
            cx={toSvgX(c)}
            cy={toSvgY(r)}
            r={CELL_SIZE * 0.44}
            fill="transparent"
            onClick={() => handleIntersectionClick(r, c)}
          />,
        )
      }
    }

    return targets
  }

  return (
    <article className="game-preview-card playable-card go-game">
      <div className="play-header">
        <div>
          <span className="eyebrow">Playable now</span>
          <h2>Classic Go on a 9x9 board with territory scoring.</h2>
          <p>
            Play locally against a friend or challenge the MCTS-powered computer at three difficulty levels.
          </p>
        </div>
        <div className="mode-switch" role="tablist" aria-label="Game mode">
          {Object.entries(modeLabels).map(([value, label]) => (
            <button
              key={value}
              className={value === mode ? 'segment-button active' : 'segment-button'}
              onClick={() => handleModeChange(value as GameMode)}
              role="tab"
              aria-selected={value === mode}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="go-layout">
        <div className="go-main">
          {mode === 'computer' && (
            <div className="mode-switch difficulty-switch" role="tablist" aria-label="Difficulty">
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <button
                  key={value}
                  className={value === difficulty ? 'segment-button active' : 'segment-button'}
                  onClick={() => setDifficulty(value as Difficulty)}
                  role="tab"
                  aria-selected={value === difficulty}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="score-grid">
            <article className="score-card">
              <span className="score-label">
                {mode === 'computer' ? 'You (Black)' : 'Black wins'}
              </span>
              <strong>{scores.black}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Captures</span>
              <strong>{gameState.captures.black} / {gameState.captures.white}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">
                {mode === 'computer' ? 'Computer (White)' : 'White wins'}
              </span>
              <strong>{scores.white}</strong>
            </article>
          </div>

          <div className="status-panel" aria-live="polite">
            <strong>{statusMessage}</strong>
            <span>
              {mode === 'computer'
                ? 'You play as Black. The computer plays White.'
                : 'Take turns on the same device. Black moves first.'}
            </span>
          </div>

          <div className="go-board-container">
            <svg
              className="go-board-svg"
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              aria-label="Go board"
              role="img"
            >
              {/* Wood background */}
              <rect width={SVG_SIZE} height={SVG_SIZE} fill="#dcb35c" rx={6} />

              {/* Grid lines */}
              {renderGridLines()}

              {/* Star points */}
              {renderHoshi()}

              {/* Territory overlay (when game is over) */}
              {renderTerritory()}

              {/* Stones */}
              {renderStones()}

              {/* Click targets */}
              {renderClickTargets()}
            </svg>
          </div>

          <div className="action-row">
            {isRoundOver ? (
              <button
                className="primary-button"
                onClick={handleNewGame}
                type="button"
              >
                New game
              </button>
            ) : (
              <>
                <button
                  className="primary-button"
                  onClick={handlePass}
                  disabled={isAiTurn}
                  type="button"
                >
                  Pass
                </button>
                <button
                  className="ghost-button"
                  onClick={handleResign}
                  disabled={isAiTurn}
                  type="button"
                >
                  Resign
                </button>
              </>
            )}
            <button className="ghost-button" onClick={handleResetScores} type="button">
              Reset scores
            </button>
          </div>
        </div>

        <aside className="go-side">
          <article className="game-detail">
            <strong>How to play</strong>
            <ul className="rule-list">
              <li>Click an empty intersection to place a stone of your color.</li>
              <li>Surround opponent stones to capture them and remove them from the board.</li>
              <li>A stone or group with no adjacent empty points (liberties) is captured.</li>
              <li>The ko rule prevents immediately recapturing a single stone that was just taken.</li>
              <li>Pass when you have no useful moves. Two consecutive passes end the game.</li>
            </ul>
          </article>

          <article className="game-detail">
            <strong>Scoring</strong>
            <ul className="rule-list">
              <li>Your score is the number of your stones on the board plus the empty points you surround (territory).</li>
              <li>White receives 6.5 points of komi to compensate for Black's first-move advantage.</li>
              <li>The player with the higher total score wins.</li>
            </ul>
          </article>
        </aside>
      </div>
    </article>
  )
}
