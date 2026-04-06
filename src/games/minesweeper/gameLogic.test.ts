import { describe, it, expect } from 'vitest'
import {
  createBoard,
  seedBoard,
  revealCells,
  toggleFlag,
  revealAllMines,
  hasWon,
  getFlagsPlaced,
  getNeighborIndices,
} from './gameLogic'

describe('createBoard', () => {
  it('creates a board with the correct number of cells', () => {
    const board = createBoard(9, 9)
    expect(board).toHaveLength(81)
  })

  it('creates cells that are unrevealed, unflagged, and have no mines', () => {
    const board = createBoard(3, 3)
    for (const cell of board) {
      expect(cell.hasMine).toBe(false)
      expect(cell.isRevealed).toBe(false)
      expect(cell.isFlagged).toBe(false)
      expect(cell.adjacentMines).toBe(0)
    }
  })
})

describe('seedBoard', () => {
  it('places the correct number of mines', () => {
    const board = seedBoard(9, 9, 10, 0)
    const mineCount = board.filter((cell) => cell.hasMine).length
    expect(mineCount).toBe(10)
  })

  it('does not place mines in the safe zone around the clicked cell', () => {
    // Use a small board where safe zone is significant
    const board = seedBoard(3, 3, 1, 4) // center cell, 3x3 board
    // Safe zone includes index 4 and all its neighbors (all cells on a 3x3 board)
    // With only 9 cells and all being safe zone, this is a degenerate case.
    // Use a bigger board instead.
    const bigBoard = seedBoard(5, 5, 5, 12) // center of 5x5
    const safeIndices = [12, ...getNeighborIndices(12, 5, 5)]
    for (const index of safeIndices) {
      expect(bigBoard[index].hasMine).toBe(false)
    }
  })

  it('computes adjacent mine counts correctly', () => {
    // Seed with known configuration: we can verify counts are non-negative and consistent
    const board = seedBoard(9, 9, 10, 0)
    for (let i = 0; i < board.length; i++) {
      if (board[i].hasMine) {
        expect(board[i].adjacentMines).toBe(0)
      } else {
        const actualNeighborMines = getNeighborIndices(i, 9, 9).filter(
          (n) => board[n].hasMine,
        ).length
        expect(board[i].adjacentMines).toBe(actualNeighborMines)
      }
    }
  })
})

describe('revealCells', () => {
  it('reveals the clicked cell', () => {
    const board = createBoard(3, 3)
    // Manually place a mine so flood fill stops
    board[8].hasMine = true
    board[5].adjacentMines = 1
    board[7].adjacentMines = 1

    const revealed = revealCells(board, 0, 3, 3)
    expect(revealed[0].isRevealed).toBe(true)
  })

  it('flood fills empty cells with zero adjacent mines', () => {
    // Create a 3x3 board with one mine in corner
    const board = createBoard(3, 3)
    board[8].hasMine = true
    // Recompute adjacentMines for neighbors of index 8 (which are 4,5,7)
    board[4].adjacentMines = 1
    board[5].adjacentMines = 1
    board[7].adjacentMines = 1

    const revealed = revealCells(board, 0, 3, 3)
    // Cells 0,1,2,3 should all be revealed (0 adjacent mines -> flood fill)
    // Plus cells 4,5,6,7 get revealed since they're neighbors and eventually the numbered ones stop the fill
    expect(revealed[0].isRevealed).toBe(true)
    expect(revealed[1].isRevealed).toBe(true)
    expect(revealed[2].isRevealed).toBe(true)
    expect(revealed[3].isRevealed).toBe(true)
    // Numbered cells adjacent to flood should also be revealed
    expect(revealed[4].isRevealed).toBe(true)
    expect(revealed[5].isRevealed).toBe(true)
    // Mine should NOT be revealed
    expect(revealed[8].isRevealed).toBe(false)
  })

  it('does not reveal flagged cells', () => {
    const board = createBoard(3, 3)
    board[1].isFlagged = true

    const revealed = revealCells(board, 0, 3, 3)
    expect(revealed[1].isRevealed).toBe(false)
    expect(revealed[1].isFlagged).toBe(true)
  })
})

describe('toggleFlag', () => {
  it('flags an unflagged cell', () => {
    const board = createBoard(3, 3)
    const result = toggleFlag(board, 0)
    expect(result[0].isFlagged).toBe(true)
  })

  it('unflags a flagged cell', () => {
    const board = createBoard(3, 3)
    board[0].isFlagged = true
    const result = toggleFlag(board, 0)
    expect(result[0].isFlagged).toBe(false)
  })

  it('does not flag a revealed cell', () => {
    const board = createBoard(3, 3)
    board[0].isRevealed = true
    const result = toggleFlag(board, 0)
    // Should return the same board reference (no change)
    expect(result).toBe(board)
    expect(result[0].isFlagged).toBe(false)
  })
})

describe('revealAllMines', () => {
  it('reveals all mine cells', () => {
    const board = createBoard(3, 3)
    board[2].hasMine = true
    board[5].hasMine = true
    const result = revealAllMines(board)
    expect(result[2].isRevealed).toBe(true)
    expect(result[5].isRevealed).toBe(true)
  })

  it('does not reveal non-mine cells', () => {
    const board = createBoard(3, 3)
    board[0].hasMine = true
    const result = revealAllMines(board)
    expect(result[1].isRevealed).toBe(false)
    expect(result[0].isRevealed).toBe(true)
  })
})

describe('hasWon', () => {
  it('returns false when unrevealed non-mine cells exist', () => {
    const board = createBoard(3, 3)
    board[0].hasMine = true
    board[1].isRevealed = true
    expect(hasWon(board)).toBe(false)
  })

  it('returns true when all non-mine cells are revealed', () => {
    const board = createBoard(3, 3)
    board[0].hasMine = true
    for (let i = 1; i < 9; i++) {
      board[i].isRevealed = true
    }
    expect(hasWon(board)).toBe(true)
  })
})

describe('getFlagsPlaced', () => {
  it('returns 0 for board with no flags', () => {
    expect(getFlagsPlaced(createBoard(3, 3))).toBe(0)
  })

  it('counts flagged cells', () => {
    const board = createBoard(3, 3)
    board[0].isFlagged = true
    board[4].isFlagged = true
    board[8].isFlagged = true
    expect(getFlagsPlaced(board)).toBe(3)
  })
})

describe('getNeighborIndices', () => {
  it('returns 3 neighbors for a corner cell', () => {
    // Top-left corner of a 3x3 grid
    const neighbors = getNeighborIndices(0, 3, 3)
    expect(neighbors).toHaveLength(3)
    expect(neighbors.sort()).toEqual([1, 3, 4])
  })

  it('returns 8 neighbors for a center cell', () => {
    const neighbors = getNeighborIndices(4, 3, 3)
    expect(neighbors).toHaveLength(8)
    expect(neighbors.sort()).toEqual([0, 1, 2, 3, 5, 6, 7, 8])
  })

  it('returns 5 neighbors for an edge cell', () => {
    // Top-middle of a 3x3 grid (index 1)
    const neighbors = getNeighborIndices(1, 3, 3)
    expect(neighbors).toHaveLength(5)
    expect(neighbors.sort()).toEqual([0, 2, 3, 4, 5])
  })

  it('handles bottom-right corner', () => {
    const neighbors = getNeighborIndices(8, 3, 3)
    expect(neighbors).toHaveLength(3)
    expect(neighbors.sort()).toEqual([4, 5, 7])
  })

  it('handles rectangular boards', () => {
    // 2 rows, 4 columns - top-left corner (index 0)
    const neighbors = getNeighborIndices(0, 2, 4)
    expect(neighbors).toHaveLength(3)
    expect(neighbors.sort()).toEqual([1, 4, 5])
  })
})
