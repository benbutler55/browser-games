import type { GameState, Move, Board, PieceType } from './gameLogic'
import { getAllLegalMoves, applyMove, getGameResult } from './gameLogic'

export type Difficulty = 'easy' | 'medium' | 'hard'

const DEPTH_MAP: Record<Difficulty, number> = {
  easy: 2,
  medium: 4,
  hard: 5,
}

// Material values in centipawns
const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 0,
}

// Piece-square tables from white's perspective (row 0 = rank 8, row 7 = rank 1)
// For black pieces, flip the row index: row -> 7 - row

const PAWN_TABLE: number[][] = [
  [  0,  0,  0,  0,  0,  0,  0,  0],
  [ 50, 50, 50, 50, 50, 50, 50, 50],
  [ 10, 10, 20, 30, 30, 20, 10, 10],
  [  5,  5, 10, 25, 25, 10,  5,  5],
  [  0,  0,  0, 20, 20,  0,  0,  0],
  [  5, -5,-10,  0,  0,-10, -5,  5],
  [  5, 10, 10,-20,-20, 10, 10,  5],
  [  0,  0,  0,  0,  0,  0,  0,  0],
]

const KNIGHT_TABLE: number[][] = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
]

const BISHOP_TABLE: number[][] = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10, 10,  5, 10, 10,  5, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
]

const ROOK_TABLE: number[][] = [
  [  0,  0,  0,  0,  0,  0,  0,  0],
  [  5, 10, 10, 10, 10, 10, 10,  5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [  0,  0,  0,  5,  5,  0,  0,  0],
]

const QUEEN_TABLE: number[][] = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20],
]

const KING_MIDDLEGAME_TABLE: number[][] = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20],
]

const PST: Record<PieceType, number[][]> = {
  pawn: PAWN_TABLE,
  knight: KNIGHT_TABLE,
  bishop: BISHOP_TABLE,
  rook: ROOK_TABLE,
  queen: QUEEN_TABLE,
  king: KING_MIDDLEGAME_TABLE,
}

/**
 * Static evaluation of the board position from white's perspective.
 * Positive values favor white, negative values favor black.
 */
function evaluate(board: Board): number {
  let score = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (!piece) continue

      const materialValue = PIECE_VALUES[piece.type]
      const table = PST[piece.type]

      // For white pieces, use the table directly
      // For black pieces, flip the row (7 - row)
      const tableRow = piece.color === 'white' ? row : 7 - row
      const positionalValue = table[tableRow][col]

      const totalValue = materialValue + positionalValue

      if (piece.color === 'white') {
        score += totalValue
      } else {
        score -= totalValue
      }
    }
  }

  return score
}

/**
 * Alpha-beta minimax search.
 * Returns the evaluation score for the given position.
 */
function alphaBeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
): number {
  // Check for terminal states
  const result = getGameResult(state)
  if (result) {
    if (result.type === 'checkmate') {
      // The winner already won — score accordingly
      // Favor faster checkmates by adding/subtracting depth
      if (result.winner === 'white') {
        return 100000 + depth
      } else {
        return -100000 - depth
      }
    }
    // Stalemate or insufficient material — draw
    return 0
  }

  // Leaf node: return static evaluation
  if (depth === 0) {
    return evaluate(state.board)
  }

  const moves = getAllLegalMoves(state)

  if (maximizingPlayer) {
    let maxEval = -Infinity
    for (const move of moves) {
      const newState = applyMove(state, move)
      const evalScore = alphaBeta(newState, depth - 1, alpha, beta, false)
      maxEval = Math.max(maxEval, evalScore)
      alpha = Math.max(alpha, evalScore)
      if (beta <= alpha) break // Beta cutoff
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of moves) {
      const newState = applyMove(state, move)
      const evalScore = alphaBeta(newState, depth - 1, alpha, beta, true)
      minEval = Math.min(minEval, evalScore)
      beta = Math.min(beta, evalScore)
      if (beta <= alpha) break // Alpha cutoff
    }
    return minEval
  }
}

/**
 * Get the best move for the current player at the given difficulty level.
 * Returns null if no legal moves are available.
 */
export function getBestMove(state: GameState, difficulty: Difficulty): Move | null {
  const moves = getAllLegalMoves(state)
  if (moves.length === 0) return null

  const depth = DEPTH_MAP[difficulty]
  const isWhite = state.turn === 'white'

  let bestMove: Move = moves[0]
  let bestEval = isWhite ? -Infinity : Infinity

  for (const move of moves) {
    const newState = applyMove(state, move)
    const evalScore = alphaBeta(
      newState,
      depth - 1,
      -Infinity,
      Infinity,
      !isWhite, // After white moves, it's black's turn (minimizing), and vice versa
    )

    if (isWhite) {
      if (evalScore > bestEval) {
        bestEval = evalScore
        bestMove = move
      }
    } else {
      if (evalScore < bestEval) {
        bestEval = evalScore
        bestMove = move
      }
    }
  }

  return bestMove
}
