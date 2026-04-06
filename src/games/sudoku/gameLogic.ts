export type SudokuBoard = number[][]
export type Difficulty = 'easy' | 'medium' | 'hard'

const CLUE_COUNTS: Record<Difficulty, number> = {
  easy: 42,
  medium: 32,
  hard: 25,
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function isValidPlacement(
  board: SudokuBoard,
  row: number,
  col: number,
  num: number,
): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === num) return false
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === num) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row && c !== col && board[r][c] === num) return false
    }
  }
  return true
}

function fillBoard(board: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of nums) {
          if (isValidPlacement(board, r, c, num)) {
            board[r][c] = num
            if (fillBoard(board)) return true
            board[r][c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function generateSolvedBoard(): SudokuBoard {
  const board: SudokuBoard = Array.from({ length: 9 }, () => Array(9).fill(0))
  fillBoard(board)
  return board
}

export function generatePuzzle(difficulty: Difficulty): {
  puzzle: SudokuBoard
  solution: SudokuBoard
} {
  const solution = generateSolvedBoard()
  const puzzle = solution.map((row) => [...row])
  const clues = CLUE_COUNTS[difficulty]
  const cellsToRemove = 81 - clues

  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number]),
  )

  let removed = 0
  for (const [r, c] of positions) {
    if (removed >= cellsToRemove) break
    puzzle[r][c] = 0
    removed++
  }

  return { puzzle, solution }
}

export function isSolved(board: SudokuBoard): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false
      if (!isValidPlacement(board, r, c, board[r][c])) return false
    }
  }
  return true
}

export function getConflicts(board: SudokuBoard): Set<string> {
  const conflicts = new Set<string>()
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c]
      if (val === 0) continue
      if (!isValidPlacement(board, r, c, val)) {
        conflicts.add(`${r},${c}`)
      }
    }
  }
  return conflicts
}
