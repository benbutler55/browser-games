import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  calculateWinner,
  createEmptyBoard,
  getBestMove,
  getNextPlayer,
  isBoardFull,
  type Board,
  type Player,
} from './gameLogic'

type GameMode = 'local' | 'computer'

type Scoreboard = {
  X: number
  O: number
  draws: number
}

const defaultScores: Scoreboard = {
  X: 0,
  O: 0,
  draws: 0,
}

const modeLabels: Record<GameMode, string> = {
  local: 'Two players',
  computer: 'Vs computer',
}

export function NoughtsAndCrossesGame() {
  const [mode, setMode] = useLocalStorage<GameMode>('nac-mode', 'local')
  const [scores, setScores] = useLocalStorage<Scoreboard>('nac-scores', defaultScores)
  const [starter, setStarter] = useLocalStorage<Player>('nac-starter', 'X')
  const [board, setBoard] = useState<Board>(() => createEmptyBoard())
  const [currentPlayer, setCurrentPlayer] = useState<Player>(starter)

  const winnerResult = useMemo(() => calculateWinner(board), [board])
  const isDraw = !winnerResult && isBoardFull(board)
  const isRoundOver = Boolean(winnerResult) || isDraw
  const isAiThinking = mode === 'computer' && currentPlayer === 'O' && !isRoundOver

  const recordWin = useCallback(
    (winner: Player) => {
      setScores((currentScores) => ({
        ...currentScores,
        [winner]: currentScores[winner] + 1,
      }))
    },
    [setScores],
  )

  const recordDraw = useCallback(() => {
    setScores((currentScores) => {
      return {
        ...currentScores,
        draws: currentScores.draws + 1,
      }
    })
  }, [setScores])

  const commitTurn = useCallback(
    (nextBoard: Board, actingPlayer: Player) => {
      const nextWinner = calculateWinner(nextBoard)
      const nextIsDraw = !nextWinner && isBoardFull(nextBoard)

      setBoard(nextBoard)

      if (nextWinner) {
        recordWin(nextWinner.winner)
        return
      }

      if (nextIsDraw) {
        recordDraw()
        return
      }

      setCurrentPlayer(getNextPlayer(actingPlayer))
    },
    [recordDraw, recordWin],
  )

  useEffect(() => {
    if (!isAiThinking) {
      return
    }

    const timer = window.setTimeout(() => {
      const move = getBestMove(board)

      if (move === -1) {
        return
      }

      const nextBoard = [...board]
      nextBoard[move] = 'O'
      commitTurn(nextBoard, 'O')
    }, 420)

    return () => window.clearTimeout(timer)
  }, [board, commitTurn, isAiThinking])

  const statusMessage = winnerResult
    ? `${winnerResult.winner} wins this round.`
    : isDraw
      ? 'This round ends in a draw.'
      : mode === 'computer' && currentPlayer === 'O'
        ? 'Computer is choosing a move...'
        : `${currentPlayer} to move.`

  function resetRound(nextStarter: Player) {
    setBoard(createEmptyBoard())
    setCurrentPlayer(nextStarter)
  }

  function handleCellClick(index: number) {
    if (board[index] || isRoundOver || isAiThinking) {
      return
    }

    const nextBoard = [...board]
    nextBoard[index] = currentPlayer

    commitTurn(nextBoard, currentPlayer)
  }

  function handleModeChange(nextMode: GameMode) {
    if (nextMode === mode) {
      return
    }

    setMode(nextMode)
    setScores(defaultScores)
    setStarter('X')
    resetRound('X')
  }

  function handleRestartRound() {
    resetRound(starter)
  }

  function handleNextRound() {
    const nextStarter = starter === 'X' ? 'O' : 'X'
    setStarter(nextStarter)
    resetRound(nextStarter)
  }

  function handleResetMatch() {
    setScores(defaultScores)
    setStarter('X')
    resetRound('X')
  }

  return (
    <article className="game-preview-card playable-card noughts-game">
      <div className="play-header">
        <div>
          <span className="eyebrow">Playable now</span>
          <h2>Board, score, and round flow are live.</h2>
          <p>
            This first shipped game proves the shared shell with a polished local
            match mode and an unbeatable computer opponent.
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

      <div className="noughts-layout">
        <div className="noughts-main">
          <div className="score-grid">
            <article className="score-card">
              <span className="score-label">X wins</span>
              <strong>{scores.X}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Draws</span>
              <strong>{scores.draws}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">
                {mode === 'computer' ? 'Computer wins' : 'O wins'}
              </span>
              <strong>{scores.O}</strong>
            </article>
          </div>

          <div className="status-panel" aria-live="polite">
            <strong>{statusMessage}</strong>
            <span>
              {mode === 'computer'
                ? 'You play as X. The computer always takes O.'
                : 'Take turns on the same device. X opens the first round.'}
            </span>
          </div>

          <div className="play-board" role="grid" aria-label="Noughts and Crosses board">
            {board.map((cell, index) => {
              const isWinningCell = winnerResult?.line.includes(index)

              return (
                <button
                  key={index}
                  className={isWinningCell ? 'board-cell winning' : 'board-cell'}
                  onClick={() => handleCellClick(index)}
                  disabled={Boolean(cell) || isRoundOver || isAiThinking}
                  type="button"
                  role="gridcell"
                  aria-label={cell ? `Cell ${index + 1}, ${cell}` : `Cell ${index + 1}, empty`}
                >
                  {cell ?? ''}
                </button>
              )
            })}
          </div>

          <div className="action-row">
            <button
              className="primary-button"
              onClick={isRoundOver ? handleNextRound : handleRestartRound}
              type="button"
            >
              {isRoundOver ? 'Start next round' : 'Restart round'}
            </button>
            <button className="ghost-button" onClick={handleResetMatch} type="button">
              Reset scores
            </button>
          </div>
        </div>

        <aside className="noughts-side">
          <article className="game-detail">
            <strong>How it works</strong>
            <ul className="rule-list">
              <li>Place three of the same mark in a row, column, or diagonal to win.</li>
              <li>The starter alternates each time you begin a new round.</li>
              <li>Scores and preferred mode are stored locally in your browser.</li>
            </ul>
          </article>

          <article className="game-detail">
            <strong>Why this game first</strong>
            <ul className="rule-list">
              <li>It validates the reusable game frame without hiding behind a complex ruleset.</li>
              <li>It introduces persistent settings, score tracking, and round-state feedback.</li>
              <li>Its board and status patterns can be reused for future turn-based games.</li>
            </ul>
          </article>
        </aside>
      </div>
    </article>
  )
}
