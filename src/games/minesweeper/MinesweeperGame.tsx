import { useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  createBoard,
  difficultyConfig,
  getFlagsPlaced,
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

const difficultyLabels: Record<DifficultyKey, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
}

const defaultBestTimes: BestTimes = {
  beginner: null,
  intermediate: null,
  expert: null,
}

export function MinesweeperGame() {
  const [difficulty, setDifficulty] = useLocalStorage<DifficultyKey>(
    'minesweeper-difficulty',
    'beginner',
  )
  const [tool, setTool] = useLocalStorage<InputTool>('minesweeper-tool', 'reveal')
  const [bestTimes, setBestTimes] = useLocalStorage<BestTimes>(
    'minesweeper-best-times',
    defaultBestTimes,
  )
  const config = difficultyConfig[difficulty]
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
          : 'Board is live. Reveal carefully and use flags to track mines.'

  function resetBoard(nextDifficulty = difficulty) {
    const nextConfig = difficultyConfig[nextDifficulty]
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
      return
    }

    const revealedBoard = revealCells(workingBoard, index, config.rows, config.columns)
    const nextPhase = hasWon(revealedBoard) ? 'won' : 'playing'

    setBoard(revealedBoard)
    setPhase(nextPhase)

    if (nextPhase === 'won') {
      updateBestTime(elapsedSeconds)
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

    applyReveal(index)
  }

  function handleDifficultyChange(nextDifficulty: DifficultyKey) {
    if (nextDifficulty === difficulty) {
      return
    }

    setDifficulty(nextDifficulty)
    resetBoard(nextDifficulty)
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
        <div className="mode-switch" role="tablist" aria-label="Difficulty">
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
              <li>Beginner, intermediate, and expert boards are available.</li>
              <li>The first reveal protects the clicked cell and its immediate neighbors.</li>
              <li>Zero-value cells expand automatically to open the board faster.</li>
            </ul>
          </article>

          <article className="game-detail">
            <strong>Persistence and expansion</strong>
            <ul className="rule-list">
              <li>Preferred difficulty, input tool, and best times are stored locally.</li>
              <li>The next likely additions are custom boards, stat history, and hints.</li>
              <li>The pure logic helpers here are designed to support tests later.</li>
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
