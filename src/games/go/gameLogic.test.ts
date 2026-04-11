import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  cloneBoard,
  opponentColor,
  getGroup,
  getLiberties,
  type GoBoard,
  type GoState,
} from './gameLogic'

describe('createInitialState', () => {
  it('creates a 9x9 board with all null cells', () => {
    const state = createInitialState()
    expect(state.board).toHaveLength(9)
    for (const row of state.board) {
      expect(row).toHaveLength(9)
      expect(row.every((cell) => cell === null)).toBe(true)
    }
  })

  it('starts with black to move', () => {
    const state = createInitialState()
    expect(state.turn).toBe('black')
  })

  it('starts with zero captures', () => {
    const state = createInitialState()
    expect(state.captures).toEqual({ black: 0, white: 0 })
  })

  it('starts with no previous board', () => {
    const state = createInitialState()
    expect(state.previousBoard).toBeNull()
  })

  it('starts with zero consecutive passes and game not over', () => {
    const state = createInitialState()
    expect(state.consecutivePasses).toBe(0)
    expect(state.gameOver).toBe(false)
  })
})

describe('cloneBoard', () => {
  it('creates a deep copy of the board', () => {
    const state = createInitialState()
    state.board[4][4] = 'black'
    const cloned = cloneBoard(state.board)
    expect(cloned[4][4]).toBe('black')
    cloned[4][4] = null
    expect(state.board[4][4]).toBe('black')
  })
})

describe('opponentColor', () => {
  it('returns white for black', () => {
    expect(opponentColor('black')).toBe('white')
  })

  it('returns black for white', () => {
    expect(opponentColor('white')).toBe('black')
  })
})

describe('getGroup', () => {
  it('returns a single stone group', () => {
    const state = createInitialState()
    state.board[4][4] = 'black'
    const group = getGroup(state.board, [4, 4])
    expect(group).toHaveLength(1)
    expect(group).toContainEqual([4, 4])
  })

  it('returns a connected group of 3 stones', () => {
    const state = createInitialState()
    state.board[4][4] = 'black'
    state.board[4][5] = 'black'
    state.board[4][6] = 'black'
    const group = getGroup(state.board, [4, 4])
    expect(group).toHaveLength(3)
    expect(group).toContainEqual([4, 4])
    expect(group).toContainEqual([4, 5])
    expect(group).toContainEqual([4, 6])
  })

  it('does not include diagonal stones in the group', () => {
    const state = createInitialState()
    state.board[4][4] = 'black'
    state.board[5][5] = 'black'
    const group = getGroup(state.board, [4, 4])
    expect(group).toHaveLength(1)
    expect(group).toContainEqual([4, 4])
  })

  it('returns empty array for empty position', () => {
    const state = createInitialState()
    const group = getGroup(state.board, [4, 4])
    expect(group).toHaveLength(0)
  })
})

describe('getLiberties', () => {
  it('center stone has 4 liberties', () => {
    const state = createInitialState()
    state.board[4][4] = 'black'
    expect(getLiberties(state.board, [4, 4])).toBe(4)
  })

  it('corner stone has 2 liberties', () => {
    const state = createInitialState()
    state.board[0][0] = 'black'
    expect(getLiberties(state.board, [0, 0])).toBe(2)
  })

  it('edge stone has 3 liberties', () => {
    const state = createInitialState()
    state.board[0][4] = 'black'
    expect(getLiberties(state.board, [0, 4])).toBe(3)
  })

  it('group of 2 adjacent center stones has 6 liberties', () => {
    const state = createInitialState()
    state.board[4][4] = 'black'
    state.board[4][5] = 'black'
    expect(getLiberties(state.board, [4, 4])).toBe(6)
  })

  it('surrounded stone has 0 liberties', () => {
    const state = createInitialState()
    state.board[4][4] = 'black'
    state.board[3][4] = 'white'
    state.board[5][4] = 'white'
    state.board[4][3] = 'white'
    state.board[4][5] = 'white'
    expect(getLiberties(state.board, [4, 4])).toBe(0)
  })
})
