import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  createInitialState,
  getLegalMoves,
  applyMove,
  getGameResult,
  isInCheck,
  opponent,
  type Color,
  type GameState,
  type Move,
  type PieceType,
  type Position,
  type Piece,
} from './gameLogic'
import { getBestMove, type Difficulty } from './chessAi'

type GameMode = 'local' | 'computer'

type Scoreboard = {
  white: number
  black: number
  draws: number
}

const defaultScores: Scoreboard = { white: 0, black: 0, draws: 0 }

const modeLabels: Record<GameMode, string> = {
  local: 'Two players',
  computer: 'Vs computer',
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const PIECE_UNICODE: Record<Color, Record<PieceType, string>> = {
  white: { king: '\u2654', queen: '\u2655', rook: '\u2656', bishop: '\u2657', knight: '\u2658', pawn: '\u2659' },
  black: { king: '\u265A', queen: '\u265B', rook: '\u265C', bishop: '\u265D', knight: '\u265E', pawn: '\u265F' },
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

const STARTING_PIECES: Record<Color, Record<PieceType, number>> = {
  white: { king: 1, queen: 1, rook: 2, bishop: 2, knight: 2, pawn: 8 },
  black: { king: 1, queen: 1, rook: 2, bishop: 2, knight: 2, pawn: 8 },
}

function countPieces(board: GameState['board']): Record<Color, Record<PieceType, number>> {
  const counts: Record<Color, Record<PieceType, number>> = {
    white: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 },
    black: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 },
  }
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        counts[piece.color][piece.type]++
      }
    }
  }
  return counts
}

function getCapturedPieces(board: GameState['board']): Record<Color, Piece[]> {
  const current = countPieces(board)
  const captured: Record<Color, Piece[]> = { white: [], black: [] }

  for (const color of ['white', 'black'] as Color[]) {
    for (const type of ['queen', 'rook', 'bishop', 'knight', 'pawn'] as PieceType[]) {
      const missing = STARTING_PIECES[color][type] - current[color][type]
      for (let i = 0; i < missing; i++) {
        captured[color].push({ type, color })
      }
    }
  }

  return captured
}

export function ChessGame() {
  const [mode, setMode] = useLocalStorage<GameMode>('chess-mode', 'local')
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('chess-difficulty', 'medium')
  const [scores, setScores] = useLocalStorage<Scoreboard>('chess-scores', defaultScores)
  const [gameState, setGameState] = useState<GameState>(() => createInitialState())
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [lastMove, setLastMove] = useState<Move | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Position; to: Position } | null>(null)

  const result = useMemo(() => getGameResult(gameState), [gameState])
  const inCheck = useMemo(() => isInCheck(gameState.board, gameState.turn), [gameState])
  const isRoundOver = result !== null
  const isAiThinking = mode === 'computer' && gameState.turn === 'black' && !isRoundOver && !pendingPromotion

  const legalMoves = useMemo(() => {
    if (!selectedSquare || isRoundOver || isAiThinking) return []
    return getLegalMoves(gameState, selectedSquare)
  }, [gameState, selectedSquare, isRoundOver, isAiThinking])

  const capturedPieces = useMemo(() => getCapturedPieces(gameState.board), [gameState.board])

  const recordResult = useCallback(
    (gameResult: NonNullable<typeof result>) => {
      setScores((s) => {
        if (gameResult.type === 'checkmate') {
          return { ...s, [gameResult.winner]: s[gameResult.winner] + 1 }
        }
        return { ...s, draws: s.draws + 1 }
      })
    },
    [setScores],
  )

  const makeMove = useCallback(
    (move: Move) => {
      const newState = applyMove(gameState, move)
      setGameState(newState)
      setLastMove(move)
      setSelectedSquare(null)

      const gameResult = getGameResult(newState)
      if (gameResult) {
        recordResult(gameResult)
      }
    },
    [gameState, recordResult],
  )

  // AI move effect
  useEffect(() => {
    if (!isAiThinking) return

    const timer = window.setTimeout(() => {
      const move = getBestMove(gameState, difficulty)
      if (move) {
        makeMove(move)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [gameState, difficulty, isAiThinking, makeMove])

  function handleSquareClick(row: number, col: number) {
    if (isRoundOver || isAiThinking || pendingPromotion) return

    const clickedPiece = gameState.board[row][col]

    // If we have a selected piece, check if this click is a legal move target
    if (selectedSquare) {
      const move = legalMoves.find(
        (m) => m.to[0] === row && m.to[1] === col,
      )

      if (move) {
        // Check if this is a promotion move (there will be multiple moves for the same to-square)
        const promoMoves = legalMoves.filter(
          (m) => m.to[0] === row && m.to[1] === col && m.promotion,
        )
        if (promoMoves.length > 0) {
          setPendingPromotion({ from: selectedSquare, to: [row, col] })
          return
        }
        makeMove(move)
        return
      }

      // Clicked on own piece — reselect
      if (clickedPiece && clickedPiece.color === gameState.turn) {
        setSelectedSquare([row, col])
        return
      }

      // Clicked on empty/enemy square that isn't a legal target — deselect
      setSelectedSquare(null)
      return
    }

    // No selection yet — select own piece
    if (clickedPiece && clickedPiece.color === gameState.turn) {
      setSelectedSquare([row, col])
    }
  }

  function handlePromotion(pieceType: PieceType) {
    if (!pendingPromotion) return
    const move: Move = {
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: pieceType,
    }
    setPendingPromotion(null)
    makeMove(move)
  }

  function handleModeChange(nextMode: GameMode) {
    if (nextMode === mode) return
    setMode(nextMode)
    setScores(defaultScores)
    setGameState(createInitialState())
    setSelectedSquare(null)
    setLastMove(null)
    setPendingPromotion(null)
  }

  function handleNewGame() {
    setGameState(createInitialState())
    setSelectedSquare(null)
    setLastMove(null)
    setPendingPromotion(null)
  }

  function handleResetScores() {
    setScores(defaultScores)
    handleNewGame()
  }

  const statusMessage = result
    ? result.type === 'checkmate'
      ? `Checkmate! ${result.winner === 'white' ? 'White' : 'Black'} wins.`
      : result.type === 'stalemate'
        ? 'Stalemate. The game is a draw.'
        : 'Draw by insufficient material.'
    : isAiThinking
      ? 'Computer is thinking...'
      : inCheck
        ? `${gameState.turn === 'white' ? 'White' : 'Black'} is in check. ${gameState.turn === 'white' ? 'White' : 'Black'} to move.`
        : `${gameState.turn === 'white' ? 'White' : 'Black'} to move.`

  const isLegalTarget = (row: number, col: number) =>
    legalMoves.some((m) => m.to[0] === row && m.to[1] === col)

  const isLastMoveSquare = (row: number, col: number) =>
    lastMove !== null &&
    ((lastMove.from[0] === row && lastMove.from[1] === col) ||
      (lastMove.to[0] === row && lastMove.to[1] === col))

  const kingPos = useMemo(() => {
    if (!inCheck) return null
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = gameState.board[r][c]
        if (p && p.type === 'king' && p.color === gameState.turn) {
          return [r, c] as const
        }
      }
    }
    return null
  }, [gameState, inCheck])

  function renderCapturedRow(color: Color) {
    const pieces = capturedPieces[color]
    if (pieces.length === 0) return null
    return (
      <div className="captured-row">
        {pieces.map((p, i) => (
          <span key={`${p.type}-${i}`} className="captured-piece">
            {PIECE_UNICODE[p.color][p.type]}
          </span>
        ))}
      </div>
    )
  }

  return (
    <article className="game-preview-card playable-card chess-game">
      <div className="play-header">
        <div>
          <span className="eyebrow">Playable now</span>
          <h2>Full chess with castling, en passant, and promotion.</h2>
          <p>
            Play locally against a friend or challenge the computer at three difficulty levels.
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

      <div className="chess-layout">
        <div className="chess-main">
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
                {mode === 'computer' ? 'You (White)' : 'White wins'}
              </span>
              <strong>{scores.white}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Draws</span>
              <strong>{scores.draws}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">
                {mode === 'computer' ? 'Computer (Black)' : 'Black wins'}
              </span>
              <strong>{scores.black}</strong>
            </article>
          </div>

          <div className="status-panel" aria-live="polite">
            <strong>{statusMessage}</strong>
            <span>
              {mode === 'computer'
                ? 'You play as White. The computer plays Black.'
                : 'Take turns on the same device. White moves first.'}
            </span>
          </div>

          <div className="chess-captured">
            {renderCapturedRow('white')}
          </div>

          <div className="chess-board-wrapper">
            <div className="chess-rank-labels" aria-hidden="true">
              {RANKS.map((rank) => (
                <span key={rank}>{rank}</span>
              ))}
            </div>
            <div>
              <div className="chess-board" role="grid" aria-label="Chess board">
                {gameState.board.map((row, rowIdx) =>
                  row.map((cell, colIdx) => {
                    const isLight = (rowIdx + colIdx) % 2 === 0
                    const isSelected =
                      selectedSquare !== null &&
                      selectedSquare[0] === rowIdx &&
                      selectedSquare[1] === colIdx
                    const isLegal = isLegalTarget(rowIdx, colIdx)
                    const isLastMove = isLastMoveSquare(rowIdx, colIdx)
                    const isKingInCheck =
                      kingPos !== null &&
                      kingPos[0] === rowIdx &&
                      kingPos[1] === colIdx

                    let className = `chess-square ${isLight ? 'light' : 'dark'}`
                    if (isSelected) className += ' selected'
                    if (isLastMove) className += ' last-move'
                    if (isKingInCheck) className += ' in-check'

                    return (
                      <button
                        key={`${rowIdx}-${colIdx}`}
                        className={className}
                        onClick={() => handleSquareClick(rowIdx, colIdx)}
                        type="button"
                        role="gridcell"
                        aria-label={`${FILES[colIdx]}${RANKS[rowIdx]}${cell ? ` ${cell.color} ${cell.type}` : ' empty'}`}
                      >
                        {cell && (
                          <span className="chess-piece">
                            {PIECE_UNICODE[cell.color][cell.type]}
                          </span>
                        )}
                        {isLegal && !cell && <span className="legal-dot" />}
                        {isLegal && cell && <span className="legal-capture" />}
                      </button>
                    )
                  }),
                )}
              </div>
              <div className="chess-file-labels" aria-hidden="true">
                {FILES.map((file) => (
                  <span key={file}>{file}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="chess-captured">
            {renderCapturedRow('black')}
          </div>

          <div className="action-row">
            <button
              className="primary-button"
              onClick={handleNewGame}
              type="button"
            >
              {isRoundOver ? 'New game' : 'Restart game'}
            </button>
            <button className="ghost-button" onClick={handleResetScores} type="button">
              Reset scores
            </button>
          </div>
        </div>

        <aside className="chess-side">
          <article className="game-detail">
            <strong>How to play</strong>
            <ul className="rule-list">
              <li>Click a piece to select it, then click a highlighted square to move.</li>
              <li>Capture opponent pieces by moving to their square.</li>
              <li>Put the opponent's king in checkmate to win the game.</li>
              <li>If a player has no legal moves and is not in check, the game is a stalemate (draw).</li>
            </ul>
          </article>

          <article className="game-detail">
            <strong>Special moves</strong>
            <ul className="rule-list">
              <li><strong>Castling:</strong> Move the king two squares toward a rook to castle, if neither piece has moved and the path is clear.</li>
              <li><strong>En passant:</strong> A pawn that advances two squares can be captured by an adjacent enemy pawn on the next move.</li>
              <li><strong>Promotion:</strong> When a pawn reaches the far rank, choose to promote it to a queen, rook, bishop, or knight.</li>
            </ul>
          </article>
        </aside>
      </div>

      {pendingPromotion && (
        <div className="chess-promo-overlay" onClick={() => setPendingPromotion(null)}>
          <div className="chess-promo-modal" onClick={(e) => e.stopPropagation()}>
            <strong>Promote pawn to:</strong>
            <div className="chess-promo-options">
              {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map((type) => (
                <button
                  key={type}
                  className="chess-promo-button"
                  onClick={() => handlePromotion(type)}
                  type="button"
                  aria-label={`Promote to ${type}`}
                >
                  {PIECE_UNICODE[gameState.turn][type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
