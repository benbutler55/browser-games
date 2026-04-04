import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  advanceSnapshot,
  AI_X,
  BALL_SIZE,
  type ControlMode,
  createServeSnapshot,
  difficultyConfig,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PLAYER_X,
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

type SpeedPreset = 'standard' | 'fast' | 'blitz'

const difficultyLabels: Record<PongDifficulty, string> = {
  casual: 'Casual',
  arcade: 'Arcade',
  expert: 'Expert',
}

const modeLabels: Record<ControlMode, string> = {
  computer: 'Vs AI',
  local: 'Two players',
}

const speedLabels: Record<SpeedPreset, string> = {
  standard: 'Standard',
  fast: 'Fast',
  blitz: 'Blitz',
}

const speedMultiplier: Record<SpeedPreset, number> = {
  standard: 1,
  fast: 1.14,
  blitz: 1.28,
}

const targetScoreOptions = [5, 7, 11]

const emptyScore: Score = {
  player: 0,
  ai: 0,
}

const emptyInputState: InputState = {
  playerUp: false,
  playerDown: false,
  opponentUp: false,
  opponentDown: false,
}

export function PongGame() {
  const [mode, setMode] = useLocalStorage<ControlMode>('pong-mode', 'computer')
  const [difficulty, setDifficulty] = useLocalStorage<PongDifficulty>('pong-difficulty', 'arcade')
  const [speed, setSpeed] = useLocalStorage<SpeedPreset>('pong-speed', 'standard')
  const [targetScore, setTargetScore] = useLocalStorage<number>('pong-target-score', 5)
  const [snapshot, setSnapshot] = useState<PongSnapshot>(() =>
    createServeSnapshot(getMatchConfig('computer', difficulty, 'standard'), 'right'),
  )
  const [score, setScore] = useState<Score>(emptyScore)
  const [phase, setPhase] = useState<MatchPhase>('ready')
  const [message, setMessage] = useState(
    getReadyMessage('computer'),
  )

  const frameRef = useRef<number | null>(null)
  const lastFrameRef = useRef<number | null>(null)
  const serveTimeoutRef = useRef<number | null>(null)
  const snapshotRef = useRef(snapshot)
  const scoreRef = useRef(score)
  const modeRef = useRef(mode)
  const difficultyRef = useRef(difficulty)
  const speedRef = useRef(speed)
  const targetScoreRef = useRef(targetScore)
  const inputRef = useRef<InputState>(emptyInputState)

  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    difficultyRef.current = difficulty
  }, [difficulty])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    targetScoreRef.current = targetScore
  }, [targetScore])

  const handleScore = useCallback((scorer: PaddleSide) => {
    const nextScore = {
      player: scoreRef.current.player + Number(scorer === 'player'),
      ai: scoreRef.current.ai + Number(scorer === 'ai'),
    }

    scoreRef.current = nextScore
    setScore(nextScore)

    if (nextScore[scorer] >= targetScoreRef.current) {
      setPhase('finished')
      setMessage(
        scorer === 'player'
          ? modeRef.current === 'computer'
            ? 'You win the match. Start a new one or raise the difficulty.'
            : 'Player 1 wins the match. Start a new round or change the settings.'
          : modeRef.current === 'computer'
            ? 'The AI takes the match. Reset and try a sharper return angle.'
            : 'Player 2 wins the match. Start a new round or change the settings.',
      )
      return
    }

    const serveDirection = scorer === 'player' ? 'right' : 'left'
    const nextSnapshot = createServeSnapshot(
      getMatchConfig(modeRef.current, difficultyRef.current, speedRef.current),
      serveDirection,
    )

    snapshotRef.current = nextSnapshot
    setSnapshot(nextSnapshot)
    setPhase('between-rounds')
    setMessage(
      scorer === 'player'
        ? modeRef.current === 'computer'
          ? 'You score. Next serve is heading back toward the AI.'
          : 'Player 1 scores. Next serve heads toward Player 2.'
        : modeRef.current === 'computer'
          ? 'The AI scores. Get ready to defend the next serve.'
          : 'Player 2 scores. Next serve heads toward Player 1.',
    )

    if (serveTimeoutRef.current !== null) {
      window.clearTimeout(serveTimeoutRef.current)
    }

    serveTimeoutRef.current = window.setTimeout(() => {
      setMessage(getLiveMessage(modeRef.current))
      setPhase('running')
    }, 900)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (key === 'w') {
        event.preventDefault()
        inputRef.current.playerUp = true
      }

      if (key === 's') {
        event.preventDefault()
        inputRef.current.playerDown = true
      }

      if (key === 'arrowup') {
        event.preventDefault()

        if (modeRef.current === 'local') {
          inputRef.current.opponentUp = true
        } else {
          inputRef.current.playerUp = true
        }
      }

      if (key === 'arrowdown') {
        event.preventDefault()

        if (modeRef.current === 'local') {
          inputRef.current.opponentDown = true
        } else {
          inputRef.current.playerDown = true
        }
      }

      if (event.code === 'Space') {
        event.preventDefault()
        setPhase((currentPhase) => {
          if (currentPhase === 'running') {
            setMessage('Match paused. Press space or resume to continue.')
            return 'paused'
          }

          if (currentPhase === 'paused' || currentPhase === 'ready') {
            setMessage(getLiveMessage(modeRef.current))
            return 'running'
          }

          return currentPhase
        })
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (key === 'w') {
        inputRef.current.playerUp = false
      }

      if (key === 's') {
        inputRef.current.playerDown = false
      }

      if (key === 'arrowup') {
        if (modeRef.current === 'local') {
          inputRef.current.opponentUp = false
        } else {
          inputRef.current.playerUp = false
        }
      }

      if (key === 'arrowdown') {
        if (modeRef.current === 'local') {
          inputRef.current.opponentDown = false
        } else {
          inputRef.current.playerDown = false
        }
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

    const config = getMatchConfig(mode, difficulty, speed)

    const frame = (timestamp: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = timestamp
        frameRef.current = window.requestAnimationFrame(frame)
        return
      }

      const deltaSeconds = Math.min((timestamp - lastFrameRef.current) / 1000, 0.032)
      lastFrameRef.current = timestamp

      const result = advanceSnapshot(
        snapshotRef.current,
        deltaSeconds,
        config,
        inputRef.current,
        mode,
      )

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
  }, [difficulty, handleScore, mode, phase, speed])

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

    const nextSnapshot = createServeSnapshot(
      getMatchConfig(modeRef.current, nextDifficulty, speedRef.current),
      'right',
    )
    snapshotRef.current = nextSnapshot
    setSnapshot(nextSnapshot)
    scoreRef.current = emptyScore
    setScore(emptyScore)
    setPhase('ready')
    setMessage(getReadyMessage(modeRef.current))
    inputRef.current = { ...emptyInputState }
  }

  function handleDifficultyChange(nextDifficulty: PongDifficulty) {
    if (nextDifficulty === difficulty) {
      return
    }

    setDifficulty(nextDifficulty)
    resetMatch(nextDifficulty)
  }

  function handleModeChange(nextMode: ControlMode) {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    modeRef.current = nextMode
    resetMatch(nextMode === 'local' ? 'arcade' : difficulty)
  }

  function handleSpeedChange(nextSpeed: SpeedPreset) {
    if (nextSpeed === speed) {
      return
    }

    setSpeed(nextSpeed)
    speedRef.current = nextSpeed
    resetMatch()
  }

  function handleTargetScoreChange(nextTargetScore: number) {
    if (nextTargetScore === targetScore) {
      return
    }

    setTargetScore(nextTargetScore)
    targetScoreRef.current = nextTargetScore
    resetMatch()
  }

  function handlePrimaryAction() {
    if (phase === 'finished') {
      resetMatch()
      return
    }

    if (phase === 'paused') {
      setMessage(getLiveMessage(mode))
      setPhase('running')
      return
    }

    if (phase === 'ready') {
      setMessage(getLiveMessage(mode))
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
            Pong now supports both AI matches and local two-player play with
            adjustable pace, score targets, touch controls, and a responsive arena.
          </p>
        </div>
        <div className="mode-switch" role="tablist" aria-label="Match mode">
          {Object.entries(modeLabels).map(([value, label]) => (
            <button
              key={value}
              className={value === mode ? 'segment-button active' : 'segment-button'}
              onClick={() => handleModeChange(value as ControlMode)}
              role="tab"
              aria-selected={value === mode}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pong-settings-grid">
        {mode === 'computer' ? (
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
        ) : (
          <div className="pong-setting-note">Two-player mode uses equal paddle speed on both sides.</div>
        )}

        <div className="mode-switch difficulty-switch" role="tablist" aria-label="Score target">
          {targetScoreOptions.map((option) => (
            <button
              key={option}
              className={option === targetScore ? 'segment-button active' : 'segment-button'}
              onClick={() => handleTargetScoreChange(option)}
              role="tab"
              aria-selected={option === targetScore}
              type="button"
            >
              First to {option}
            </button>
          ))}
        </div>

        <div className="mode-switch difficulty-switch" role="tablist" aria-label="Pace">
          {Object.entries(speedLabels).map(([value, label]) => (
            <button
              key={value}
              className={value === speed ? 'segment-button active' : 'segment-button'}
              onClick={() => handleSpeedChange(value as SpeedPreset)}
              role="tab"
              aria-selected={value === speed}
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
              <strong>{targetScore}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">{mode === 'computer' ? 'AI' : 'Player 2'}</span>
              <strong>{score.ai}</strong>
            </article>
          </div>

          <div className="status-panel" aria-live="polite">
            <strong>{message}</strong>
            <span>
              {mode === 'computer'
                ? 'Controls: W / S or arrow keys, plus Space to pause or resume.'
                : 'Controls: Player 1 uses W / S, Player 2 uses arrow keys, and Space pauses.'}
            </span>
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

          <div className="pong-touch-controls" aria-label="Touch controls">
            <div className="touch-paddle-controls">
              <span>Player 1</span>
              <div className="touch-buttons">
                <TouchButton
                  label="Up"
                  onPressChange={(pressed) => {
                    inputRef.current.playerUp = pressed
                  }}
                />
                <TouchButton
                  label="Down"
                  onPressChange={(pressed) => {
                    inputRef.current.playerDown = pressed
                  }}
                />
              </div>
            </div>
            {mode === 'local' ? (
              <div className="touch-paddle-controls">
                <span>Player 2</span>
                <div className="touch-buttons">
                  <TouchButton
                    label="Up"
                    onPressChange={(pressed) => {
                      inputRef.current.opponentUp = pressed
                    }}
                  />
                  <TouchButton
                    label="Down"
                    onPressChange={(pressed) => {
                      inputRef.current.opponentDown = pressed
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="pong-side">
          <article className="game-detail">
            <strong>Current ruleset</strong>
            <ul className="rule-list">
              <li>Pick between AI play or local two-player before you start the match.</li>
              <li>Score targets of 5, 7, or 11 change how long each match runs.</li>
              <li>The AI gets faster and cleaner as you raise the difficulty.</li>
              <li>Each paddle contact adds a little pace and changes the ball angle.</li>
            </ul>
          </article>

          <article className="game-detail">
            <strong>Winning tips</strong>
            <ul className="rule-list">
              <li>Meet the ball with the upper or lower edge of your paddle to change its angle.</li>
              <li>Shorter rallies are easier on expert, so reset your position after every return.</li>
              <li>In two-player mode, recover to the center after each shot instead of chasing immediately.</li>
              <li>Use the pause flow between long rallies if you need to reset the pace.</li>
            </ul>
          </article>
        </aside>
      </div>
    </article>
  )
}

type TouchButtonProps = {
  label: string
  onPressChange: (pressed: boolean) => void
}

function TouchButton({ label, onPressChange }: TouchButtonProps) {
  return (
    <button
      className="touch-button"
      onPointerCancel={() => onPressChange(false)}
      onPointerDown={() => onPressChange(true)}
      onPointerLeave={() => onPressChange(false)}
      onPointerUp={() => onPressChange(false)}
      type="button"
    >
      {label}
    </button>
  )
}

function getMatchConfig(
  mode: ControlMode,
  difficulty: PongDifficulty,
  speed: SpeedPreset,
) {
  const baseConfig = mode === 'local' ? difficultyConfig.arcade : difficultyConfig[difficulty]
  const multiplier = speedMultiplier[speed]

  return {
    ...baseConfig,
    paddleSpeed: baseConfig.paddleSpeed * (mode === 'local' ? 1 : 1),
    ballSpeed: baseConfig.ballSpeed * multiplier,
    maxBallSpeed: baseConfig.maxBallSpeed * multiplier,
  }
}

function getReadyMessage(mode: ControlMode) {
  return mode === 'computer'
    ? 'Press start match, then move with W/S or the arrow keys.'
    : 'Press start match. Player 1 uses W/S and Player 2 uses arrow keys.'
}

function getLiveMessage(mode: ControlMode) {
  return mode === 'computer'
    ? 'Rally in progress. Keep the ball away from your wall.'
    : 'Rally in progress. Outmaneuver the other paddle and guard your side.'
}
