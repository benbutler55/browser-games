import { useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  BOARD_SIZE,
  DEFAULT_FLEET,
  createBoardState,
  createRandomFleet,
  countSunkShips,
  fireShot,
  getVisibleCellState,
  isFleetPlaced,
  removeShip,
  upsertShip,
  type BoardState,
  type Orientation,
} from './gameLogic'
import {
  createInitialAiMemory,
  getNextAiShot,
  recordAiShotResult,
  type AiMemory,
  type Difficulty,
} from './battleshipsAi'

type Phase = 'placement' | 'battle' | 'game-over'
type Turn = 'player' | 'ai'

type Scoreboard = {
  wins: number
  losses: number
}

const defaultScores: Scoreboard = {
  wins: 0,
  losses: 0,
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

function describeShot(result: 'miss' | 'hit' | 'sunk', actor: 'You' | 'Computer'): string {
  if (result === 'miss') {
    return `${actor} missed.`
  }
  if (result === 'hit') {
    return `${actor} scored a hit.`
  }
  return `${actor} sank a ship.`
}

function nextUnplacedShipId(ships: BoardState['ships']): number | null {
  for (let id = 0; id < DEFAULT_FLEET.length; id++) {
    if (!ships.some((ship) => ship.id === id)) {
      return id
    }
  }
  return null
}

export function BattleshipsGame() {
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('battleships-difficulty', 'medium')
  const [scores, setScores] = useLocalStorage<Scoreboard>('battleships-scores', defaultScores)

  const [phase, setPhase] = useState<Phase>('placement')
  const [turn, setTurn] = useState<Turn>('player')
  const [orientation, setOrientation] = useState<Orientation>('horizontal')
  const [selectedShipId, setSelectedShipId] = useState(0)
  const [lastEvent, setLastEvent] = useState('Place your fleet to begin.')
  const [playerBoard, setPlayerBoard] = useState<BoardState>(() => createBoardState(BOARD_SIZE))
  const [enemyBoard, setEnemyBoard] = useState<BoardState>(() => createBoardState(BOARD_SIZE))
  const [aiMemory, setAiMemory] = useState<AiMemory>(() => createInitialAiMemory())

  const placementComplete = useMemo(
    () => isFleetPlaced(playerBoard.ships, DEFAULT_FLEET),
    [playerBoard.ships],
  )
  const playerSunkCount = useMemo(() => countSunkShips(playerBoard), [playerBoard])
  const enemySunkCount = useMemo(() => countSunkShips(enemyBoard), [enemyBoard])

  const statusMessage =
    phase === 'placement'
      ? 'Place every ship, then start the battle.'
      : phase === 'game-over'
        ? enemySunkCount === DEFAULT_FLEET.length
          ? 'Victory! You sank the full enemy fleet.'
          : 'Defeat. The computer sank your fleet first.'
        : turn === 'ai'
          ? 'Computer is choosing a target...'
          : 'Your turn. Fire on the enemy board.'

  function handlePlaceShip(row: number, col: number) {
    if (phase !== 'placement') {
      return
    }

    const length = DEFAULT_FLEET[selectedShipId]
    const nextShips = upsertShip(
      playerBoard.ships,
      {
        id: selectedShipId,
        length,
        row,
        col,
        orientation,
      },
      BOARD_SIZE,
    )

    if (!nextShips) {
      setLastEvent('That ship does not fit there. Try another position.')
      return
    }

    setPlayerBoard((current) => ({
      ...current,
      ships: nextShips,
      shots: [],
    }))

    const nextId = nextUnplacedShipId(nextShips)
    if (nextId !== null) {
      setSelectedShipId(nextId)
    }

    setLastEvent(`Placed ship length ${length}.`)
  }

  function handleStartBattle() {
    if (!placementComplete) {
      return
    }

    setEnemyBoard({
      size: BOARD_SIZE,
      ships: createRandomFleet(DEFAULT_FLEET, BOARD_SIZE),
      shots: [],
    })
    setPlayerBoard((current) => ({ ...current, shots: [] }))
    setAiMemory(createInitialAiMemory())
    setPhase('battle')
    setTurn('player')
    setLastEvent('Battle started. Fire the first shot.')
  }

  function handleEnemyCellClick(row: number, col: number) {
    if (phase !== 'battle' || turn !== 'player') {
      return
    }

    const outcome = fireShot(enemyBoard, [row, col])
    if (outcome.result === 'repeat') {
      return
    }

    setEnemyBoard(outcome.board)
    setLastEvent(describeShot(outcome.result, 'You'))

    if (outcome.gameOver) {
      setPhase('game-over')
      setScores((current) => ({ ...current, wins: current.wins + 1 }))
      return
    }

    setTurn('ai')
  }

  function handleRandomizeFleet() {
    const randomFleet = createRandomFleet(DEFAULT_FLEET, BOARD_SIZE)
    setPlayerBoard((current) => ({
      ...current,
      ships: randomFleet,
      shots: [],
    }))
    setSelectedShipId(0)
    setLastEvent('Fleet randomized. Start the battle when ready.')
  }

  function handleClearFleet() {
    setPlayerBoard((current) => ({
      ...current,
      ships: [],
      shots: [],
    }))
    setSelectedShipId(0)
    setLastEvent('Fleet cleared. Place ships again.')
  }

  function handleRemoveSelectedShip() {
    setPlayerBoard((current) => ({
      ...current,
      ships: removeShip(current.ships, selectedShipId),
      shots: current.shots,
    }))
    setLastEvent(`Removed ship length ${DEFAULT_FLEET[selectedShipId]}.`)
  }

  function handleNewRound() {
    setPhase('placement')
    setTurn('player')
    setOrientation('horizontal')
    setSelectedShipId(0)
    setLastEvent('Place your fleet to begin.')
    setAiMemory(createInitialAiMemory())
    setPlayerBoard(createBoardState(BOARD_SIZE))
    setEnemyBoard(createBoardState(BOARD_SIZE))
  }

  function handleResetScores() {
    setScores(defaultScores)
    handleNewRound()
  }

  useEffect(() => {
    if (phase !== 'battle' || turn !== 'ai') {
      return
    }

    const timer = window.setTimeout(() => {
      const shot = getNextAiShot(difficulty, aiMemory, playerBoard.shots, BOARD_SIZE)
      const outcome = fireShot(playerBoard, shot)

      if (outcome.result === 'repeat') {
        setTurn('player')
        return
      }

      setPlayerBoard(outcome.board)
      setAiMemory((current) =>
        recordAiShotResult(current, shot, outcome.result, BOARD_SIZE, outcome.board.shots),
      )
      setLastEvent(describeShot(outcome.result, 'Computer'))

      if (outcome.gameOver) {
        setPhase('game-over')
        setScores((current) => ({ ...current, losses: current.losses + 1 }))
        return
      }

      setTurn('player')
    }, 550)

    return () => window.clearTimeout(timer)
  }, [phase, turn, difficulty, aiMemory, playerBoard, setScores])

  return (
    <div className="battleships-layout">
      <div className="battleships-main">
        <div className="score-grid">
          <article className="score-card">
            <span className="score-label">Wins</span>
            <strong>{scores.wins}</strong>
          </article>
          <article className="score-card">
            <span className="score-label">Losses</span>
            <strong>{scores.losses}</strong>
          </article>
          <article className="score-card">
            <span className="score-label">Difficulty</span>
            <strong>{difficultyLabels[difficulty]}</strong>
          </article>
        </div>

        <div className="status-panel" role="status" aria-live="polite">
          <span>{statusMessage}</span>
          <strong>{lastEvent}</strong>
        </div>

        <div className="mode-switch difficulty-switch">
          {(['easy', 'medium', 'hard'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`segment-button ${difficulty === value ? 'active' : ''}`}
              onClick={() => setDifficulty(value)}
            >
              {difficultyLabels[value]}
            </button>
          ))}
        </div>

        {phase === 'placement' && (
          <section className="battleships-setup panel">
            <div className="battleships-setup-row">
              <strong>Fleet placement</strong>
              <span>
                {playerBoard.ships.length} / {DEFAULT_FLEET.length} ships placed
              </span>
            </div>

            <div className="battleships-ship-picker" role="radiogroup" aria-label="Select ship length">
              {DEFAULT_FLEET.map((length, shipId) => {
                const placed = playerBoard.ships.some((ship) => ship.id === shipId)
                return (
                  <button
                    key={shipId}
                    type="button"
                    role="radio"
                    aria-checked={selectedShipId === shipId}
                    className={`segment-button ${selectedShipId === shipId ? 'active' : ''}`}
                    onClick={() => setSelectedShipId(shipId)}
                  >
                    L{length} {placed ? '✓' : ''}
                  </button>
                )
              })}
            </div>

            <div className="battleships-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setOrientation((current) =>
                    current === 'horizontal' ? 'vertical' : 'horizontal',
                  )
                }
              >
                Rotate ({orientation === 'horizontal' ? 'Horizontal' : 'Vertical'})
              </button>
              <button type="button" className="ghost-button" onClick={handleRandomizeFleet}>
                Randomize fleet
              </button>
              <button type="button" className="ghost-button" onClick={handleRemoveSelectedShip}>
                Remove selected
              </button>
              <button type="button" className="ghost-button" onClick={handleClearFleet}>
                Clear fleet
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleStartBattle}
                disabled={!placementComplete}
              >
                Start battle
              </button>
            </div>
          </section>
        )}

        <div className="battleships-board-grid">
          <section className="battleships-board-panel">
            <div className="battleships-board-heading">
              <strong>Your fleet</strong>
              <span>
                {playerSunkCount}/{DEFAULT_FLEET.length} sunk
              </span>
            </div>
            <div className="battleships-board" role="grid" aria-label="Your board">
              {Array.from({ length: BOARD_SIZE }, (_, row) =>
                Array.from({ length: BOARD_SIZE }, (_, col) => {
                  const state = getVisibleCellState(playerBoard, row, col, true)

                  return (
                    <button
                      key={`player-${row}-${col}`}
                      type="button"
                      className={`battleships-cell ${state}`}
                      onClick={() => handlePlaceShip(row, col)}
                      disabled={phase !== 'placement'}
                      aria-label={`Row ${row + 1}, column ${col + 1}`}
                    />
                  )
                }),
              )}
            </div>
          </section>

          <section className="battleships-board-panel">
            <div className="battleships-board-heading">
              <strong>Enemy waters</strong>
              <span>
                {enemySunkCount}/{DEFAULT_FLEET.length} sunk
              </span>
            </div>
            <div className="battleships-board" role="grid" aria-label="Enemy board">
              {Array.from({ length: BOARD_SIZE }, (_, row) =>
                Array.from({ length: BOARD_SIZE }, (_, col) => {
                  const state = getVisibleCellState(enemyBoard, row, col, false)
                  const canFire = phase === 'battle' && turn === 'player'

                  return (
                    <button
                      key={`enemy-${row}-${col}`}
                      type="button"
                      className={`battleships-cell ${state}`}
                      onClick={() => handleEnemyCellClick(row, col)}
                      disabled={!canFire}
                      aria-label={`Target row ${row + 1}, column ${col + 1}`}
                    />
                  )
                }),
              )}
            </div>
          </section>
        </div>

        <div className="battleships-actions">
          <button type="button" className="ghost-button" onClick={handleNewRound}>
            New round
          </button>
          <button type="button" className="ghost-button" onClick={handleResetScores}>
            Reset scores
          </button>
        </div>
      </div>

      <div className="battleships-side">
        <article className="game-detail">
          <strong>How to play</strong>
          <ul className="rule-list">
            <li>Place your full fleet before the battle starts.</li>
            <li>Click enemy cells to fire one shot per turn.</li>
            <li>Hit every segment of a ship to sink it.</li>
            <li>Sink all five enemy ships before yours are sunk.</li>
          </ul>
        </article>

        <article className="game-detail">
          <strong>AI difficulty</strong>
          <ul className="rule-list">
            <li>Easy fires random legal shots.</li>
            <li>Medium hunts nearby cells after a hit.</li>
            <li>Hard uses checkerboard hunting with line follow-ups.</li>
            <li>Use New round to quickly replay with the same settings.</li>
          </ul>
        </article>
      </div>
    </div>
  )
}
