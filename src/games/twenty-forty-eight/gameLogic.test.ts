import { describe, it, expect } from 'vitest'
import {
  createInitialBoard,
  slideRow,
  move,
  hasAvailableMove,
  getBestTile,
  addRandomTile,
  createEmptyBoard,
} from './gameLogic'

describe('createInitialBoard', () => {
  it('creates a 4x4 grid', () => {
    const board = createInitialBoard()
    expect(board).toHaveLength(4)
    for (const row of board) {
      expect(row).toHaveLength(4)
    }
  })

  it('has exactly 2 non-zero tiles', () => {
    const board = createInitialBoard()
    const nonZero = board.flat().filter((v) => v !== 0)
    expect(nonZero).toHaveLength(2)
  })
})

describe('slideRow', () => {
  it('merges a pair', () => {
    const { row, score } = slideRow([2, 2, 0, 0])
    expect(row).toEqual([4, 0, 0, 0])
    expect(score).toBe(4)
  })

  it('handles double merge (2,2,2,2 -> 4,4,0,0)', () => {
    const { row, score } = slideRow([2, 2, 2, 2])
    expect(row).toEqual([4, 4, 0, 0])
    expect(score).toBe(8)
  })

  it('does not merge through a different tile', () => {
    const { row } = slideRow([2, 4, 2, 0])
    expect(row).toEqual([2, 4, 2, 0])
  })

  it('handles an empty row', () => {
    const { row, score } = slideRow([0, 0, 0, 0])
    expect(row).toEqual([0, 0, 0, 0])
    expect(score).toBe(0)
  })

  it('handles a fully packed row with no merges', () => {
    const { row, score } = slideRow([2, 4, 8, 16])
    expect(row).toEqual([2, 4, 8, 16])
    expect(score).toBe(0)
  })
})

describe('move', () => {
  it('returns changed=false when no movement is possible', () => {
    const board = [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    const result = move(board, 'left')
    expect(result.changed).toBe(false)
  })

  it('returns changed=true when tiles move', () => {
    const board = [
      [0, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    const result = move(board, 'left')
    expect(result.changed).toBe(true)
    expect(result.board[0][0]).toBe(2)
  })

  it('moves tiles up correctly', () => {
    const board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ]
    const result = move(board, 'up')
    expect(result.changed).toBe(true)
    expect(result.board[0][0]).toBe(2)
    expect(result.board[3][0]).toBe(0)
  })

  it('moves tiles down correctly', () => {
    const board = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    const result = move(board, 'down')
    expect(result.changed).toBe(true)
    expect(result.board[3][0]).toBe(2)
    expect(result.board[0][0]).toBe(0)
  })

  it('moves tiles right correctly', () => {
    const board = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    const result = move(board, 'right')
    expect(result.changed).toBe(true)
    expect(result.board[0][3]).toBe(2)
    expect(result.board[0][0]).toBe(0)
  })
})

describe('hasAvailableMove', () => {
  it('returns true when there are empty cells', () => {
    const board = [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    expect(hasAvailableMove(board)).toBe(true)
  })

  it('returns false when full with no merges', () => {
    const board = [
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 2],
    ]
    expect(hasAvailableMove(board)).toBe(false)
  })

  it('returns true when full but a merge is possible', () => {
    const board = [
      [2, 4, 8, 16],
      [16, 8, 4, 2],
      [2, 4, 8, 16],
      [16, 8, 4, 4],
    ]
    expect(hasAvailableMove(board)).toBe(true)
  })
})

describe('getBestTile', () => {
  it('returns the highest value on the board', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
    expect(getBestTile(board)).toBe(256)
  })
})

describe('addRandomTile', () => {
  it('fills one empty cell', () => {
    const board = createEmptyBoard()
    board[0][0] = 2
    const after = addRandomTile(board)
    const nonZero = after.flat().filter((v) => v !== 0)
    expect(nonZero).toHaveLength(2)
  })
})
