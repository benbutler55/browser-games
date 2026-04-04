import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  advanceSnapshot,
  AI_X,
  BALL_SIZE,
  createServeSnapshot,
  difficultyConfig,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PLAYER_X,
  TARGET_SCORE,
  type InputState,
  type PaddleSide,
  type PongDifficulty,
  type PongSnapshot,
} from './gameLogic'

type MatchPhase = 'ready' | 'running' | 'paused' | 'between-rounds' | 'finished'

type Score = {
  player: number
  ai: number
}

const difficultyLabels: Record<PongDifficulty, string> = {
  casual: 'Casual',
  arcade: 'Arcade',
  expert: 'Expert',
}

const emptyScore: Score = {
  player: 0,
  ai: 0,
}

export function PongGame() {
  const [difficulty, setDifficulty] = useLocalStorage<PongDifficulty>('pong-difficulty', 'arcade')
  const [snapshot, setSnapshot] = useState<PongSnapshot>(() =>
    createServeSnapshot(difficultyConfig[difficulty], 'right'),
  )
  const [score, setScore] = useState<Score>(emptyScore)
  const [phase, setPhase] = useState<MatchPhase>('ready')
  const [message, setMessage] = useState(
    'Press start match, then move with W/S or the arrow keys.',
  )

  const frameRef = useRef<number | null>(null)
  const lastFrameRef = useRef<number | null>(null)
  const serveTimeoutRef = useRef<number | null>(null)
  const snapshotRef = useRef(snapshot)
  const scoreRef = useRef(score)
  const difficultyRef = useRef(difficulty)
  const inputRef = useRef<InputState>({ moveUp: false, moveDown: false })

  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])

  const handleScore = useCallback((scorer: PaddleSide) => {
    const nextScore = {
      player: scoreRef.current.player + Number(scorer === 'player'),
      ai: scoreRef.current.ai + Number(scorer === 'ai'),
    }

    scoreRef.current = nextScore
    setScore(nextScore)

    if (nextScore[scorer] >= TARGET_SCORE) {
      setPhase('finished')
      setMessage(
        scorer === 'player'
          ? 'You win the match. Start a new one or raise the difficulty.'
          : 'The AI takes the match. Reset and try a sharper return angle.',
      )
      return
    }

    const serveDirection = scorer === 'player' ? 'right' : 'left'
    const nextSnapshot = createServeSnapshot(
      difficultyConfig[difficultyRef.current],
      serveDirection,
    )

    snapshotRef.current = nextSnapshot
    setSnapshot(nextSnapshot)
    setPhase('between-rounds')
    setMessage(
      scorer === 'player'
        ? 'You score. Next serve is heading back toward the AI.'
        : 'The AI scores. Get ready to defend the next serve.',
    )

    if (serveTimeoutRef.current !== null) {
      window.clearTimeout(serveTimeoutRef.current)
    }

    serveTimeoutRef.current = window.setTimeout(() => {
      setMessage('Rally in progress. Keep the ball away from your wall.')
      setPhase('running')
    }, 900)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (key === 'w' || key === 'arrowup') {
        event.preventDefault()
        inputRef.current.moveUp = true
      }

      if (key === 's' || key === 'arrowdown') {
        event.preventDefault()
        inputRef.current.moveDown = true
      }

      if (event.code === 'Space') {
        event.preventDefault()
        setPhase((currentPhase) => {
          if (currentPhase === 'running') {
            setMessage('Match paused. Press space or resume to continue.')
            return 'paused'
          }

          if (currentPhase === 'paused' || currentPhase === 'ready') {
            setMessage('Rally in progress. Keep the ball away from your wall.')
            return 'running'
          }

          return currentPhase
        })
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (key === 'w' || key === 'arrowup') {
        inputRef.current.moveUp = false
      }

      if (key === 's' || key === 'arrowdown') {
        inputRef.current.moveDown = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'running') {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      frameRef.current = null
      lastFrameRef.current = null
      return
    }

    const config = difficultyConfig[difficulty]

    const frame = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp
        frameRef.current = window.requestAnimationFrame(frame)
        return
      }

      const deltaSeconds = Math.min((timestamp - lastFrameRef.current) / 1000, 0.032)
      lastFrameRef.current = timestamp

      const result = advanceSnapshot(snapshotRef.current, deltaSeconds, config, inputRef.current)

      if (result.scorer) {
        handleScore(result.scorer)
        return
      }

      snapshotRef.current = result.snapshot
      setSnapshot(result.snapshot)
      frameRef.current = window.requestAnimationFrame(frame)
    }

    frameRef.current = window.requestAnimationFrame(frame)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      frameRef.current = null
      lastFrameRef.current = null
    }
  }, [difficulty, handleScore, phase])

  useEffect(() => {
    return () => {
      if (serveTimeoutRef.current !== null) {
        window.clearTimeout(serveTimeoutRef.current)
      }
    }
  }, [])

  function resetMatch(nextDifficulty = difficulty) {
    if (serveTimeoutRef.current !== null) {
      window.clearTimeout(serveTimeoutRef.current)
      serveTimeoutRef.current = null
    }

    const nextSnapshot = createServeSnapshot(difficultyConfig[nextDifficulty], 'right')
    snapshotRef.current = nextSnapshot
    setSnapshot(nextSnapshot)
    scoreRef.current = emptyScore
    setScore(emptyScore)
    setPhase('ready')
    setMessage('Press start match, then move with W/S or the arrow keys.')
    inputRef.current = { moveUp: false, moveDown: false }
  }

  function handleDifficultyChange(nextDifficulty: PongDifficulty) {
    if (nextDifficulty === difficulty) {
      return
    }

    setDifficulty(nextDifficulty)
    resetMatch(nextDifficulty)
  }

  function handlePrimaryAction() {
    if (phase === 'finished') {
      resetMatch()
      return
    }

    if (phase === 'paused') {
      setMessage('Rally in progress. Keep the ball away from your wall.')
      setPhase('running')
      return
    }

    if (phase === 'ready') {
      setMessage('Rally in progress. Keep the ball away from your wall.')
      setPhase('running')
    }
  }

  const primaryLabel =
    phase === 'finished'
      ? 'Start new match'
      : phase === 'paused'
        ? 'Resume'
        : phase === 'ready'
          ? 'Start match'
          : 'Match live'

  return (
    <article className="game-preview-card playable-card pong-game">
      <div className="play-header">
        <div>
          <span className="eyebrow">Playable now</span>
          <h2>Realtime motion, keyboard control, and AI pacing are live.</h2>
          <p>
            Pong now ships as a one-player arcade match with three difficulty
            presets, pause and restart flow, and a responsive arena.
          </p>
        </div>
        <div className="mode-switch difficulty-switch" role="tablist" aria-label="Difficulty">
          {Object.entries(difficultyLabels).map(([value, label]) => (
            <button
              key={value}
              className={value === difficulty ? 'segment-button active' : 'segment-button'}
              onClick={() => handleDifficultyChange(value as PongDifficulty)}
              role="tab"
              aria-selected={value === difficulty}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pong-layout">
        <div className="pong-main">
          <div className="score-grid">
            <article className="score-card">
              <span className="score-label">You</span>
              <strong>{score.player}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Target</span>
              <strong>{TARGET_SCORE}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">AI</span>
              <strong>{score.ai}</strong>
            </article>
          </div>

          <div className="status-panel" aria-live="polite">
            <strong>{message}</strong>
            <span>Controls: `W` / `S`, arrow keys, and `Space` to pause or resume.</span>
          </div>

          <div className="action-row">
            <button
              className="primary-button"
              onClick={handlePrimaryAction}
              type="button"
              disabled={phase === 'running' || phase === 'between-rounds'}
            >
              {primaryLabel}
            </button>
            <button className="ghost-button" onClick={() => resetMatch()} type="button">
              Reset match
            </button>
          </div>

          <div className="pong-arena-wrap">
            <div className="pong-arena" role="img" aria-label="Pong playfield">
              <div className="pong-center-line" aria-hidden="true" />
              <div className="pong-net-score player">{score.player}</div>
              <div className="pong-net-score ai">{score.ai}</div>
              <div
                className="pong-paddle player"
                style={{
                  left: `${PLAYER_X}%`,
                  top: `${snapshot.playerY}%`,
                  width: `${PADDLE_WIDTH}%`,
                  height: `${PADDLE_HEIGHT}%`,
                }}
              />
              <div
                className="pong-paddle ai"
                style={{
                  left: `${AI_X}%`,
                  top: `${snapshot.aiY}%`,
                  width: `${PADDLE_WIDTH}%`,
                  height: `${PADDLE_HEIGHT}%`,
                }}
              />
              <div
                className="pong-ball"
                style={{
                  left: `${snapshot.ballX}%`,
                  top: `${snapshot.ballY}%`,
                  width: `${BALL_SIZE}%`,
                  height: `${BALL_SIZE}%`,
                }}
              />
              {phase !== 'running' ? (
                <div className="pong-overlay">
                  <strong>
                    {phase === 'between-rounds'
                      ? 'Next serve incoming'
                      : phase === 'finished'
                        ? 'Match complete'
                        : phase === 'paused'
                          ? 'Paused'
                          : 'Ready'}
                  </strong>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="pong-side">
          <article className="game-detail">
            <strong>Current ruleset</strong>
            <ul className="rule-list">
              <li>First to five points wins the match.</li>
              <li>The AI gets faster and cleaner as you raise the difficulty.</li>
              <li>Each paddle contact adds a little pace and changes the ball angle.</li>
            </ul>
          </article>

          <article className="game-detail">
            <strong>Why this matters</strong>
            <ul className="rule-list">
              <li>It proves the app can handle realtime loops without a backend.</li>
              <li>It establishes keyboard, pause, restart, and serve-state patterns.</li>
              <li>Its motion helpers are a good base for later animation-heavy games.</li>
            </ul>
          </article>
        </aside>
      </div>
    </article>
  )
}
