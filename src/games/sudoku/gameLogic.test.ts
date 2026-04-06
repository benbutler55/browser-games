import { describe, it, expect } from 'vitest'
import { generatePuzzle, isValidPlacement, isSolved, getConflicts } from './gameLogic'

describe('generatePuzzle', () => {
  it('produces a 9x9 grid', () => {
    const { puzzle } = generatePuzzle('easy')
    expect(puzzle).toHaveLength(9)
    for (const row of puzzle) {
      expect(row).toHaveLength(9)
    }
  })

  it('has empty cells in the puzzle', () => {
    const { puzzle } = generatePuzzle('medium')
    const zeros = puzzle.flat().filter((v) => v === 0).length
    expect(zeros).toBeGreaterThan(0)
  })

  it('solution has no zeros', () => {
    const { solution } = generatePuzzle('hard')
    const zeros = solution.flat().filter((v) => v === 0).length
    expect(zeros).toBe(0)
  })

  it('solution is valid', () => {
    const { solution } = generatePuzzle('easy')
    expect(isSolved(solution)).toBe(true)
  })
})

describe('isValidPlacement', () => {
  const board = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ]

  it('returns true for a valid placement', () => {
    expect(isValidPlacement(board, 0, 2, 4)).toBe(true)
  })

  it('returns false for a row conflict', () => {
    expect(isValidPlacement(board, 0, 2, 5)).toBe(false)
  })

  it('returns false for a column conflict', () => {
    expect(isValidPlacement(board, 0, 2, 8)).toBe(false)
  })

  it('returns false for a box conflict', () => {
    expect(isValidPlacement(board, 0, 2, 9)).toBe(false)
  })
})

describe('isSolved', () => {
  it('returns false for an empty board', () => {
    const empty = Array.from({ length: 9 }, () => Array(9).fill(0))
    expect(isSolved(empty)).toBe(false)
  })
})

describe('getConflicts', () => {
  it('returns empty set for a valid board', () => {
    const { solution } = generatePuzzle('easy')
    expect(getConflicts(solution).size).toBe(0)
  })

  it('detects row conflicts', () => {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0))
    board[0][0] = 5
    board[0][1] = 5
    const conflicts = getConflicts(board)
    expect(conflicts.has('0,0')).toBe(true)
    expect(conflicts.has('0,1')).toBe(true)
  })
})
