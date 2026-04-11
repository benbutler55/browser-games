import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  cloneBoard,
  opponentColor,
  getGroup,
  getLiberties,
  placeStone,
  pass,
  calculateScore,
  getTerritory,
  boardsEqual,
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

describe('placeStone', () => {
  it('places a stone and switches turn', () => {
    const state = createInitialState()
    const result = placeStone(state, [4, 4])
    expect(result).not.toBeNull()
    expect(result!.board[4][4]).toBe('black')
    expect(result!.turn).toBe('white')
  })

  it('returns null when placing on an occupied intersection', () => {
    const state = createInitialState()
    state.board[4][4] = 'black'
    const result = placeStone(state, [4, 4])
    expect(result).toBeNull()
  })

  it('captures a surrounded opponent stone (4 black around 1 white)', () => {
    const state = createInitialState()
    // White stone in the center
    state.board[4][4] = 'white'
    // Black stones on 3 sides
    state.board[3][4] = 'black'
    state.board[5][4] = 'black'
    state.board[4][3] = 'black'
    // Black to play the last surrounding stone
    state.turn = 'black'
    const result = placeStone(state, [4, 5])
    expect(result).not.toBeNull()
    expect(result!.board[4][4]).toBeNull() // white stone captured
    expect(result!.board[4][5]).toBe('black') // new black stone placed
    expect(result!.captures.black).toBe(1)
  })

  it('captures a group of 2 opponent stones', () => {
    const state = createInitialState()
    // Two white stones in a row
    state.board[4][4] = 'white'
    state.board[4][5] = 'white'
    // Black stones surrounding them
    state.board[3][4] = 'black'
    state.board[3][5] = 'black'
    state.board[5][4] = 'black'
    state.board[5][5] = 'black'
    state.board[4][3] = 'black'
    // Black plays the last surrounding position
    state.turn = 'black'
    const result = placeStone(state, [4, 6])
    expect(result).not.toBeNull()
    expect(result!.board[4][4]).toBeNull()
    expect(result!.board[4][5]).toBeNull()
    expect(result!.captures.black).toBe(2)
  })

  it('returns null for suicide move (playing into surrounded position with no captures)', () => {
    const state = createInitialState()
    // White stones surrounding the center
    state.board[3][4] = 'white'
    state.board[5][4] = 'white'
    state.board[4][3] = 'white'
    state.board[4][5] = 'white'
    // Black tries to play into the center (suicide)
    state.turn = 'black'
    const result = placeStone(state, [4, 4])
    expect(result).toBeNull()
  })

  it('detects ko and prevents immediate recapture', () => {
    // Set up the ko position:
    //     col: 0 1 2 3
    // row0: .  B  W  .
    // row1: B  W  .  W
    // row2: .  B  W  .
    const state = createInitialState()
    state.board[0][1] = 'black'
    state.board[0][2] = 'white'
    state.board[1][0] = 'black'
    state.board[1][1] = 'white'
    state.board[1][3] = 'white'
    state.board[2][1] = 'black'
    state.board[2][2] = 'white'
    state.turn = 'black'

    // Black plays (1,2) capturing white at (1,1)
    const afterBlackCapture = placeStone(state, [1, 2])
    expect(afterBlackCapture).not.toBeNull()
    expect(afterBlackCapture!.board[1][1]).toBeNull() // white captured
    expect(afterBlackCapture!.board[1][2]).toBe('black') // black placed
    expect(afterBlackCapture!.captures.black).toBe(1)

    // White tries (1,1) to recapture - should be rejected (ko)
    const koAttempt = placeStone(afterBlackCapture!, [1, 1])
    expect(koAttempt).toBeNull()
  })

  it('records the move in moveHistory', () => {
    const state = createInitialState()
    const result = placeStone(state, [4, 4])
    expect(result).not.toBeNull()
    expect(result!.moveHistory).toContainEqual([4, 4])
  })

  it('returns null when game is over', () => {
    const state = createInitialState()
    state.gameOver = true
    const result = placeStone(state, [4, 4])
    expect(result).toBeNull()
  })
})

describe('pass', () => {
  it('switches turn on pass', () => {
    const state = createInitialState()
    const result = pass(state)
    expect(result.turn).toBe('white')
  })

  it('increments consecutivePasses', () => {
    const state = createInitialState()
    const result = pass(state)
    expect(result.consecutivePasses).toBe(1)
  })

  it('two consecutive passes end the game', () => {
    const state = createInitialState()
    const afterFirst = pass(state)
    expect(afterFirst.gameOver).toBe(false)
    const afterSecond = pass(afterFirst)
    expect(afterSecond.gameOver).toBe(true)
    expect(afterSecond.consecutivePasses).toBe(2)
  })

  it('clears previousBoard (passing clears ko)', () => {
    const state = createInitialState()
    state.previousBoard = cloneBoard(state.board)
    const result = pass(state)
    expect(result.previousBoard).toBeNull()
  })
})

describe('boardsEqual', () => {
  it('returns true for identical boards', () => {
    const state = createInitialState()
    const clone = cloneBoard(state.board)
    expect(boardsEqual(state.board, clone)).toBe(true)
  })

  it('returns false for different boards', () => {
    const state = createInitialState()
    const clone = cloneBoard(state.board)
    clone[4][4] = 'black'
    expect(boardsEqual(state.board, clone)).toBe(false)
  })
})

describe('calculateScore', () => {
  it('empty board scores 0 black, 6.5 white (komi)', () => {
    const state = createInitialState()
    const score = calculateScore(state.board)
    expect(score.black).toBe(0)
    expect(score.white).toBe(6.5)
  })

  it('board with 4 black stones and no territory scores 4 black', () => {
    // Place both colors so empty regions are contested (not owned by either)
    const state = createInitialState()
    state.board[4][4] = 'black'
    state.board[4][5] = 'black'
    state.board[4][6] = 'black'
    state.board[4][7] = 'black'
    state.board[0][0] = 'white' // white stone makes empty regions contested
    const score = calculateScore(state.board)
    expect(score.black).toBe(4)
    // White gets 1 stone + 6.5 komi
    expect(score.white).toBe(7.5)
  })

  it('counts territory for a color that fully encloses an empty region', () => {
    // Create a small enclosed territory for black in the corner
    // Black walls off the (0,0) corner:
    //   . B . . . . . . .
    //   B B . . . . . . .
    //   . . . . . . . . .
    const state = createInitialState()
    state.board[0][1] = 'black'
    state.board[1][0] = 'black'
    state.board[1][1] = 'black'
    const score = calculateScore(state.board)
    // All empty cells are bordered only by black (no white stones on the board),
    // so the entire board counts as black territory: 3 stones + 78 empty = 81
    expect(score.black).toBe(81)
    expect(score.white).toBe(6.5)
  })
})

describe('getTerritory', () => {
  it('returns a board showing territory ownership', () => {
    const state = createInitialState()
    const territory = getTerritory(state.board)
    expect(territory).toHaveLength(9)
    for (const row of territory) {
      expect(row).toHaveLength(9)
    }
  })

  it('marks enclosed empty region as territory for the surrounding color', () => {
    // Black encloses corner (0,0)
    const state = createInitialState()
    state.board[0][1] = 'black'
    state.board[1][0] = 'black'
    state.board[1][1] = 'black'
    const territory = getTerritory(state.board)
    expect(territory[0][0]).toBe('black')
  })

  it('marks contested empty regions as null', () => {
    // Both colors border a region
    const state = createInitialState()
    state.board[0][0] = 'black'
    state.board[0][8] = 'white'
    const territory = getTerritory(state.board)
    // The large empty region is bordered by both colors
    expect(territory[4][4]).toBeNull()
  })
})
