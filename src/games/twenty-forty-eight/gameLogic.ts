export type Board = number[][]
export type Direction = 'up' | 'down' | 'left' | 'right'

export function createEmptyBoard(): Board {
  return Array.from({ length: 4 }, () => Array(4).fill(0))
}

export function addRandomTile(board: Board): Board {
  const empty: [number, number][] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) empty.push([r, c])
    }
  }
  if (empty.length === 0) return board
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const next = board.map((row) => [...row])
  next[r][c] = Math.random() < 0.9 ? 2 : 4
  return next
}

export function createInitialBoard(): Board {
  let board = createEmptyBoard()
  board = addRandomTile(board)
  board = addRandomTile(board)
  return board
}

export function slideRow(row: number[]): { row: number[]; score: number } {
  // Remove zeros
  const filtered = row.filter((v) => v !== 0)
  const result: number[] = []
  let score = 0
  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2
      result.push(merged)
      score += merged
      i += 2
    } else {
      result.push(filtered[i])
      i += 1
    }
  }
  while (result.length < 4) result.push(0)
  return { row: result, score }
}

function rotateLeft(board: Board): Board {
  const n = board.length
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => board[c][n - 1 - r]),
  )
}

function rotateRight(board: Board): Board {
  const n = board.length
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => board[n - 1 - c][r]),
  )
}

function rotate180(board: Board): Board {
  return rotateLeft(rotateLeft(board))
}

export function move(
  board: Board,
  direction: Direction,
): { board: Board; score: number; changed: boolean } {
  // Rotate so we always slide left
  let rotated: Board
  if (direction === 'left') rotated = board.map((r) => [...r])
  else if (direction === 'right') rotated = rotate180(board)
  else if (direction === 'up') rotated = rotateLeft(board)
  else rotated = rotateRight(board)

  let totalScore = 0
  const slid = rotated.map((row) => {
    const { row: newRow, score } = slideRow(row)
    totalScore += score
    return newRow
  })

  // Rotate back
  let result: Board
  if (direction === 'left') result = slid
  else if (direction === 'right') result = rotate180(slid)
  else if (direction === 'up') result = rotateRight(slid)
  else result = rotateLeft(slid)

  const changed = board.some((row, r) => row.some((v, c) => v !== result[r][c]))

  return { board: result, score: totalScore, changed }
}

export function hasAvailableMove(board: Board): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return true
      if (c + 1 < 4 && board[r][c] === board[r][c + 1]) return true
      if (r + 1 < 4 && board[r][c] === board[r + 1][c]) return true
    }
  }
  return false
}

export function getBestTile(board: Board): number {
  let best = 0
  for (const row of board) {
    for (const v of row) {
      if (v > best) best = v
    }
  }
  return best
}
