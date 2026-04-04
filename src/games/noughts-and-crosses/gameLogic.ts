export type Player = 'X' | 'O'
export type Cell = Player | null
export type Board = Cell[]

type WinnerResult = {
  winner: Player
  line: number[]
}

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export function createEmptyBoard(): Board {
  return Array<Cell>(9).fill(null)
}

export function getNextPlayer(player: Player): Player {
  return player === 'X' ? 'O' : 'X'
}

export function calculateWinner(board: Board): WinnerResult | null {
  for (const line of winningLines) {
    const [first, second, third] = line
    const candidate = board[first]

    if (candidate && candidate === board[second] && candidate === board[third]) {
      return {
        winner: candidate,
        line,
      }
    }
  }

  return null
}

export function isBoardFull(board: Board) {
  return board.every((cell) => cell !== null)
}

export function getAvailableMoves(board: Board) {
  return board.flatMap((cell, index) => (cell === null ? [index] : []))
}

export function getBestMove(
  board: Board,
  aiPlayer: Player = 'O',
  humanPlayer: Player = 'X',
) {
  const availableMoves = getAvailableMoves(board)

  if (availableMoves.length === 0) {
    return -1
  }

  let bestScore = Number.NEGATIVE_INFINITY
  let bestMove = availableMoves[0]

  for (const move of availableMoves) {
    const nextBoard = [...board]
    nextBoard[move] = aiPlayer

    const score = minimax(nextBoard, humanPlayer, aiPlayer, humanPlayer, 0)

    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

function minimax(
  board: Board,
  currentPlayer: Player,
  aiPlayer: Player,
  humanPlayer: Player,
  depth: number,
): number {
  const result = calculateWinner(board)

  if (result?.winner === aiPlayer) {
    return 10 - depth
  }

  if (result?.winner === humanPlayer) {
    return depth - 10
  }

  if (isBoardFull(board)) {
    return 0
  }

  const availableMoves = getAvailableMoves(board)

  if (currentPlayer === aiPlayer) {
    let bestScore = Number.NEGATIVE_INFINITY

    for (const move of availableMoves) {
      const nextBoard = [...board]
      nextBoard[move] = currentPlayer
      bestScore = Math.max(
        bestScore,
        minimax(nextBoard, getNextPlayer(currentPlayer), aiPlayer, humanPlayer, depth + 1),
      )
    }

    return bestScore
  }

  let bestScore = Number.POSITIVE_INFINITY

  for (const move of availableMoves) {
    const nextBoard = [...board]
    nextBoard[move] = currentPlayer
    bestScore = Math.min(
      bestScore,
      minimax(nextBoard, getNextPlayer(currentPlayer), aiPlayer, humanPlayer, depth + 1),
    )
  }

  return bestScore
}
