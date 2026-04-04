import { useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  createBoard,
  difficultyConfig,
  getFlagsPlaced,
  getNeighborIndices,
  hasWon,
  revealAllMines,
  revealCells,
  seedBoard,
  toggleFlag,
  type Cell,
  type DifficultyKey,
} from './gameLogic'

type Phase = 'idle' | 'playing' | 'won' | 'lost'
type InputTool = 'reveal' | 'flag'

type BestTimes = Record<DifficultyKey, number | null>
type CustomConfig = { rows: number; columns: number; mines: number }
type Stats = { wins: number; losses: number; currentStreak: number; bestStreak: number }

const difficultyLabels: Record<DifficultyKey, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
  custom: 'Custom',
}

const defaultBestTimes: BestTimes = {
  beginner: null,
  intermediate: null,
  expert: null,
  custom: null,
}

const defaultCustomConfig: CustomConfig = {
  rows: 12,
  columns: 18,
  mines: 30,
}

const defaultStats: Stats = {
  wins: 0,
  losses: 0,
  currentStreak: 0,
  bestStreak: 0,
}

export function MinesweeperGame() {
  const [difficulty, setDifficulty] = useLocalStorage<DifficultyKey>(
    'minesweeper-difficulty',
    'beginner',
  )
  const [tool, setTool] = useLocalStorage<InputTool>('minesweeper-tool', 'reveal')
  const [customConfig, setCustomConfig] = useLocalStorage<CustomConfig>(
    'minesweeper-custom-config',
    defaultCustomConfig,
  )
  const [bestTimes, setBestTimes] = useLocalStorage<BestTimes>(
    'minesweeper-best-times',
    defaultBestTimes,
  )
  const [stats, setStats] = useLocalStorage<Stats>('minesweeper-stats', defaultStats)
  const config = getConfigForDifficulty(difficulty, customConfig)
  const [board, setBoard] = useState<Cell[]>(() => createBoard(config.rows, config.columns))
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (phase !== 'playing') {
      return
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [phase])

  const flagsPlaced = useMemo(() => getFlagsPlaced(board), [board])
  const minesLeft = Math.max(config.mines - flagsPlaced, 0)
  const bestTime = bestTimes[difficulty]

  const statusMessage =
    phase === 'won'
      ? 'Board cleared. Every safe tile is open.'
      : phase === 'lost'
        ? 'Mine triggered. Reset and try a new route.'
        : phase === 'idle'
          ? 'First reveal is always safe and opens a clean pocket.'
          : 'Board is live. Click revealed numbers to chord when adjacent flags match.'

  function resetBoard(nextDifficulty = difficulty) {
    const nextConfig = getConfigForDifficulty(nextDifficulty, customConfig)
    setBoard(createBoard(nextConfig.rows, nextConfig.columns))
    setPhase('idle')
    setElapsedSeconds(0)
  }

  function updateBestTime(nextTime: number) {
    setBestTimes((currentTimes) => {
      const currentBest = currentTimes[difficulty]

      if (currentBest !== null && currentBest <= nextTime) {
        return currentTimes
      }

      return {
        ...currentTimes,
        [difficulty]: nextTime,
      }
    })
  }

  function recordWin(nextTime: number) {
    updateBestTime(nextTime)
    setStats((currentStats) => {
      const nextStreak = currentStats.currentStreak + 1

      return {
        wins: currentStats.wins + 1,
        losses: currentStats.losses,
        currentStreak: nextStreak,
        bestStreak: Math.max(currentStats.bestStreak, nextStreak),
      }
    })
  }

  function recordLoss() {
    setStats((currentStats) => ({
      ...currentStats,
      losses: currentStats.losses + 1,
      currentStreak: 0,
    }))
  }

  function applyReveal(index: number) {
    if (phase === 'won' || phase === 'lost') {
      return
    }

    let workingBoard = board

    if (phase === 'idle') {
      workingBoard = seedBoard(config.rows, config.columns, config.mines, index)
    }

    const chosenCell = workingBoard[index]

    if (chosenCell.isFlagged || chosenCell.isRevealed) {
      return
    }

    if (chosenCell.hasMine) {
      setBoard(revealAllMines(workingBoard))
      setPhase('lost')
      recordLoss()
      return
    }

    const revealedBoard = revealCells(workingBoard, index, config.rows, config.columns)
    const nextPhase = hasWon(revealedBoard) ? 'won' : 'playing'

    setBoard(revealedBoard)
    setPhase(nextPhase)

    if (nextPhase === 'won') {
      recordWin(elapsedSeconds)
    }
  }

  function applyChord(index: number) {
    if (phase !== 'playing') {
      return
    }

    const chosenCell = board[index]

    if (!chosenCell.isRevealed || chosenCell.adjacentMines === 0) {
      return
    }

    const neighborIndices = getNeighborIndices(index, config.rows, config.columns)
    const flaggedNeighbors = neighborIndices.filter((neighborIndex) => board[neighborIndex].isFlagged)

    if (flaggedNeighbors.length !== chosenCell.adjacentMines) {
      return
    }

    const hiddenNeighbors = neighborIndices.filter((neighborIndex) => {
      const neighbor = board[neighborIndex]
      return !neighbor.isRevealed && !neighbor.isFlagged
    })

    if (hiddenNeighbors.length === 0) {
      return
    }

    if (hiddenNeighbors.some((neighborIndex) => board[neighborIndex].hasMine)) {
      setBoard(revealAllMines(board))
      setPhase('lost')
      recordLoss()
      return
    }

    let nextBoard = board

    for (const neighborIndex of hiddenNeighbors) {
      nextBoard = revealCells(nextBoard, neighborIndex, config.rows, config.columns)
    }

    const nextPhase = hasWon(nextBoard) ? 'won' : 'playing'
    setBoard(nextBoard)
    setPhase(nextPhase)

    if (nextPhase === 'won') {
      recordWin(elapsedSeconds)
    }
  }

  function applyFlag(index: number) {
    if (phase === 'won' || phase === 'lost') {
      return
    }

    setBoard((currentBoard) => toggleFlag(currentBoard, index))
  }

  function handleCellAction(index: number) {
    if (tool === 'flag') {
      applyFlag(index)
      return
    }

    if (board[index].isRevealed) {
      applyChord(index)
      return
    }

    applyReveal(index)
  }

  function handleDifficultyChange(nextDifficulty: DifficultyKey) {
    if (nextDifficulty === difficulty) {
      return
    }

    setDifficulty(nextDifficulty)
    resetBoard(nextDifficulty)
  }

  function handleCustomConfigChange(
    field: keyof CustomConfig,
    value: string,
  ) {
    const nextValue = Number.parseInt(value, 10)

    setCustomConfig((currentConfig) => {
      const rawConfig = {
        ...currentConfig,
        [field]: Number.isNaN(nextValue) ? currentConfig[field] : nextValue,
      }

      return normalizeCustomConfig(rawConfig)
    })
  }

  function handleApplyCustomBoard() {
    const normalizedConfig = normalizeCustomConfig(customConfig)
    setCustomConfig(normalizedConfig)
    setDifficulty('custom')
    setBoard(createBoard(normalizedConfig.rows, normalizedConfig.columns))
    setPhase('idle')
    setElapsedSeconds(0)
  }

  return (
    <article className="game-preview-card playable-card minesweeper-game">
      <div className="play-header">
        <div>
          <span className="eyebrow">Playable now</span>
          <h2>Grid logic, flood reveal, and first-click safety are live.</h2>
          <p>
            Minesweeper now ships with three difficulty presets, timer tracking,
            local best times, and both reveal and flag interactions.
          </p>
        </div>
        <div className="mode-switch difficulty-switch" role="tablist" aria-label="Difficulty">
          {Object.entries(difficultyLabels).map(([value, label]) => (
            <button
              key={value}
              className={value === difficulty ? 'segment-button active' : 'segment-button'}
              onClick={() => handleDifficultyChange(value as DifficultyKey)}
              role="tab"
              aria-selected={value === difficulty}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        {difficulty === 'custom' ? (
          <div className="custom-board-controls">
            <label className="custom-field">
              <span>Rows</span>
              <input
                max={24}
                min={8}
                onChange={(event) => handleCustomConfigChange('rows', event.target.value)}
                type="number"
                value={customConfig.rows}
              />
            </label>
            <label className="custom-field">
              <span>Columns</span>
              <input
                max={30}
                min={8}
                onChange={(event) => handleCustomConfigChange('columns', event.target.value)}
                type="number"
                value={customConfig.columns}
              />
            </label>
            <label className="custom-field">
              <span>Mines</span>
              <input
                max={Math.max(customConfig.rows * customConfig.columns - 10, 10)}
                min={1}
                onChange={(event) => handleCustomConfigChange('mines', event.target.value)}
                type="number"
                value={customConfig.mines}
              />
            </label>
            <button className="ghost-button" onClick={handleApplyCustomBoard} type="button">
              Apply custom board
            </button>
          </div>
        ) : null}
      </div>

      <div className="minesweeper-layout">
        <div className="minesweeper-main">
          <div className="score-grid mines-meta-grid">
            <article className="score-card">
              <span className="score-label">Mines left</span>
              <strong>{minesLeft}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Time</span>
              <strong>{elapsedSeconds}s</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Best</span>
              <strong>{bestTime === null ? '--' : `${bestTime}s`}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Streak</span>
              <strong>{stats.currentStreak}</strong>
            </article>
          </div>

          <div className="status-panel" aria-live="polite">
            <strong>{statusMessage}</strong>
            <span>
              Use right-click to flag on desktop, or switch tools for touch-friendly play.
            </span>
          </div>

          <div className="action-row">
            <div className="mode-switch tool-switch" role="tablist" aria-label="Input tool">
              <button
                className={tool === 'reveal' ? 'segment-button active' : 'segment-button'}
                onClick={() => setTool('reveal')}
                role="tab"
                aria-selected={tool === 'reveal'}
                type="button"
              >
                Reveal
              </button>
              <button
                className={tool === 'flag' ? 'segment-button active' : 'segment-button'}
                onClick={() => setTool('flag')}
                role="tab"
                aria-selected={tool === 'flag'}
                type="button"
              >
                Flag
              </button>
            </div>
            <button className="primary-button" onClick={() => resetBoard()} type="button">
              New board
            </button>
          </div>

          <div className="minesweeper-board-wrap">
            <div
              className="minesweeper-board"
              role="grid"
              aria-label="Minesweeper board"
              style={{
                gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))`,
              }}
            >
              {board.map((cell, index) => {
                const cellLabel = cell.isRevealed
                  ? cell.hasMine
                    ? 'Mine'
                    : cell.adjacentMines > 0
                      ? `${cell.adjacentMines} adjacent mines`
                      : 'Empty'
                  : cell.isFlagged
                    ? 'Flagged'
                    : 'Hidden'

                return (
                  <button
                    key={index}
                    className={getCellClassName(cell)}
                    onClick={() => handleCellAction(index)}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      applyFlag(index)
                    }}
                    type="button"
                    role="gridcell"
                    aria-label={`Cell ${index + 1}, ${cellLabel}`}
                  >
                    {getCellContent(cell)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <aside className="minesweeper-side">
          <article className="game-detail">
            <strong>Current ruleset</strong>
            <ul className="rule-list">
              <li>Beginner, intermediate, expert, and custom boards are available.</li>
              <li>The first reveal protects the clicked cell and its immediate neighbors.</li>
              <li>Click a revealed number to chord when its adjacent flags match the number.</li>
            </ul>
          </article>

          <article className="game-detail">
            <strong>Stats and tips</strong>
            <ul className="rule-list">
              <li>Wins: {stats.wins}, losses: {stats.losses}, best streak: {stats.bestStreak}.</li>
              <li>Flags are only markers for you, so keep the count honest as you reason through the board.</li>
              <li>Open corners created by zero-value cells first; they reveal the most information quickly.</li>
            </ul>
          </article>
        </aside>
      </div>
    </article>
  )
}

function getCellClassName(cell: Cell) {
  if (!cell.isRevealed) {
    return cell.isFlagged ? 'mine-cell hidden flagged' : 'mine-cell hidden'
  }

  if (cell.hasMine) {
    return 'mine-cell revealed mine'
  }

  return cell.adjacentMines > 0
    ? `mine-cell revealed value-${cell.adjacentMines}`
    : 'mine-cell revealed'
}

function getCellContent(cell: Cell) {
  if (!cell.isRevealed) {
    return cell.isFlagged ? 'F' : ''
  }

  if (cell.hasMine) {
    return 'X'
  }

  return cell.adjacentMines > 0 ? cell.adjacentMines : ''
}

function getConfigForDifficulty(difficulty: DifficultyKey, customConfig: CustomConfig) {
  return difficulty === 'custom' ? normalizeCustomConfig(customConfig) : difficultyConfig[difficulty]
}

function normalizeCustomConfig(config: CustomConfig) {
  const rows = clamp(config.rows, 8, 24)
  const columns = clamp(config.columns, 8, 30)
  const maxMines = Math.max(rows * columns - 10, 10)
  const mines = clamp(config.mines, 1, maxMines)

  return {
    rows,
    columns,
    mines,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
