export type DifficultyKey = 'beginner' | 'intermediate' | 'expert'

export type DifficultyConfig = {
  rows: number
  columns: number
  mines: number
}

export type Cell = {
  hasMine: boolean
  adjacentMines: number
  isRevealed: boolean
  isFlagged: boolean
}

export const difficultyConfig: Record<DifficultyKey, DifficultyConfig> = {
  beginner: {
    rows: 9,
    columns: 9,
    mines: 10,
  },
  intermediate: {
    rows: 16,
    columns: 16,
    mines: 40,
  },
  expert: {
    rows: 16,
    columns: 30,
    mines: 99,
  },
}

export function createBoard(rows: number, columns: number): Cell[] {
  return Array.from({ length: rows * columns }, () => ({
    hasMine: false,
    adjacentMines: 0,
    isRevealed: false,
    isFlagged: false,
  }))
}

export function seedBoard(
  rows: number,
  columns: number,
  mines: number,
  safeIndex: number,
): Cell[] {
  const board = createBoard(rows, columns)
  const safeZone = new Set([safeIndex, ...getNeighborIndices(safeIndex, rows, columns)])
  const candidates = board.flatMap((_, index) => (safeZone.has(index) ? [] : [index]))

  shuffle(candidates)

  for (const mineIndex of candidates.slice(0, mines)) {
    board[mineIndex].hasMine = true
  }

  return board.map((cell, index) => ({
    ...cell,
    adjacentMines: cell.hasMine
      ? 0
      : getNeighborIndices(index, rows, columns).filter(
          (neighborIndex) => board[neighborIndex].hasMine,
        ).length,
  }))
}

export function revealCells(
  board: Cell[],
  startIndex: number,
  rows: number,
  columns: number,
): Cell[] {
  const nextBoard = board.map((cell) => ({ ...cell }))
  const queue = [startIndex]

  while (queue.length > 0) {
    const index = queue.shift()

    if (index === undefined) {
      continue
    }

    const cell = nextBoard[index]

    if (cell.isRevealed || cell.isFlagged) {
      continue
    }

    cell.isRevealed = true

    if (cell.hasMine || cell.adjacentMines > 0) {
      continue
    }

    for (const neighborIndex of getNeighborIndices(index, rows, columns)) {
      const neighbor = nextBoard[neighborIndex]

      if (!neighbor.isRevealed && !neighbor.isFlagged) {
        queue.push(neighborIndex)
      }
    }
  }

  return nextBoard
}

export function toggleFlag(board: Cell[], index: number): Cell[] {
  const cell = board[index]

  if (cell.isRevealed) {
    return board
  }

  return board.map((currentCell, currentIndex) =>
    currentIndex === index
      ? { ...currentCell, isFlagged: !currentCell.isFlagged }
      : currentCell,
  )
}

export function revealAllMines(board: Cell[]): Cell[] {
  return board.map((cell) =>
    cell.hasMine ? { ...cell, isRevealed: true } : cell,
  )
}

export function hasWon(board: Cell[]): boolean {
  return board.every((cell) => cell.hasMine || cell.isRevealed)
}

export function getFlagsPlaced(board: Cell[]) {
  return board.filter((cell) => cell.isFlagged).length
}

function getNeighborIndices(index: number, rows: number, columns: number) {
  const row = Math.floor(index / columns)
  const column = index % columns
  const neighbors: number[] = []

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) {
        continue
      }

      const nextRow = row + rowOffset
      const nextColumn = column + columnOffset

      if (
        nextRow >= 0 &&
        nextRow < rows &&
        nextColumn >= 0 &&
        nextColumn < columns
      ) {
        neighbors.push(nextRow * columns + nextColumn)
      }
    }
  }

  return neighbors
}

function shuffle<T>(items: T[]) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = items[index]
    items[index] = items[swapIndex]
    items[swapIndex] = currentItem
  }
}
