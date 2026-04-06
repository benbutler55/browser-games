import { describe, it, expect } from 'vitest'
import {
  createEmptyBoard,
  getNextPlayer,
  calculateWinner,
  isBoardFull,
  getAvailableMoves,
  getBestMove,
  type Board,
} from './gameLogic'

describe('createEmptyBoard', () => {
  it('returns a board with 9 null cells', () => {
    const board = createEmptyBoard()
    expect(board).toHaveLength(9)
    expect(board.every((cell) => cell === null)).toBe(true)
  })
})

describe('getNextPlayer', () => {
  it('returns O when given X', () => {
    expect(getNextPlayer('X')).toBe('O')
  })

  it('returns X when given O', () => {
    expect(getNextPlayer('O')).toBe('X')
  })
})

describe('calculateWinner', () => {
  it('returns null for an empty board', () => {
    expect(calculateWinner(createEmptyBoard())).toBeNull()
  })

  it('detects a row win', () => {
    const board: Board = [
      'X', 'X', 'X',
      'O', 'O', null,
      null, null, null,
    ]
    const result = calculateWinner(board)
    expect(result).toEqual({ winner: 'X', line: [0, 1, 2] })
  })

  it('detects a middle row win', () => {
    const board: Board = [
      'X', null, null,
      'O', 'O', 'O',
      'X', null, null,
    ]
    const result = calculateWinner(board)
    expect(result).toEqual({ winner: 'O', line: [3, 4, 5] })
  })

  it('detects a column win', () => {
    const board: Board = [
      'X', 'O', null,
      'X', 'O', null,
      'X', null, null,
    ]
    const result = calculateWinner(board)
    expect(result).toEqual({ winner: 'X', line: [0, 3, 6] })
  })

  it('detects a diagonal win (top-left to bottom-right)', () => {
    const board: Board = [
      'X', 'O', null,
      'O', 'X', null,
      null, null, 'X',
    ]
    const result = calculateWinner(board)
    expect(result).toEqual({ winner: 'X', line: [0, 4, 8] })
  })

  it('detects a diagonal win (top-right to bottom-left)', () => {
    const board: Board = [
      null, null, 'O',
      'X', 'O', null,
      'O', 'X', 'X',
    ]
    const result = calculateWinner(board)
    expect(result).toEqual({ winner: 'O', line: [2, 4, 6] })
  })

  it('returns null when no winner', () => {
    const board: Board = [
      'X', 'O', 'X',
      'X', 'O', 'O',
      'O', 'X', 'X',
    ]
    expect(calculateWinner(board)).toBeNull()
  })
})

describe('isBoardFull', () => {
  it('returns false for empty board', () => {
    expect(isBoardFull(createEmptyBoard())).toBe(false)
  })

  it('returns false for partially filled board', () => {
    const board: Board = ['X', null, null, null, null, null, null, null, null]
    expect(isBoardFull(board)).toBe(false)
  })

  it('returns true for full board', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    expect(isBoardFull(board)).toBe(true)
  })
})

describe('getAvailableMoves', () => {
  it('returns all indices for empty board', () => {
    expect(getAvailableMoves(createEmptyBoard())).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('returns only empty indices', () => {
    const board: Board = ['X', null, 'O', null, 'X', null, null, null, null]
    expect(getAvailableMoves(board)).toEqual([1, 3, 5, 6, 7, 8])
  })

  it('returns empty array for full board', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    expect(getAvailableMoves(board)).toEqual([])
  })
})

describe('getBestMove', () => {
  it('returns -1 when no moves available', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']
    expect(getBestMove(board)).toBe(-1)
  })

  it('takes a winning move when available', () => {
    // O can win by playing position 2
    const board: Board = [
      'X', 'X', null,
      'O', 'O', null,
      null, null, null,
    ]
    // AI is O, should pick 5 to win
    expect(getBestMove(board, 'O', 'X')).toBe(5)
  })

  it('blocks opponent from winning', () => {
    // X has two in a row at 0,1 - needs to block at 2
    const blockBoard: Board = [
      'X', 'X', null,
      'O', null, null,
      null, null, null,
    ]
    // AI is O, human is X. X threatens row 0 (positions 0,1). O must block at 2.
    const move = getBestMove(blockBoard, 'O', 'X')
    expect(move).toBe(2)
  })

  it('takes the only available move', () => {
    const board: Board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', null, 'X']
    expect(getBestMove(board)).toBe(7)
  })
})
