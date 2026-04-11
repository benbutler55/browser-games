import { describe, it, expect } from 'vitest'
import {
  createInitialBoard,
  createInitialState,
  cloneBoard,
  opponent,
  type Board,
  type Piece,
} from './gameLogic'

describe('createInitialBoard', () => {
  it('returns an 8x8 board', () => {
    const board = createInitialBoard()
    expect(board).toHaveLength(8)
    for (const row of board) {
      expect(row).toHaveLength(8)
    }
  })

  it('places black back rank on row 0', () => {
    const board = createInitialBoard()
    const expectedTypes = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    for (let col = 0; col < 8; col++) {
      const piece = board[0][col] as Piece
      expect(piece).not.toBeNull()
      expect(piece.color).toBe('black')
      expect(piece.type).toBe(expectedTypes[col])
    }
  })

  it('places black pawns on row 1', () => {
    const board = createInitialBoard()
    for (let col = 0; col < 8; col++) {
      const piece = board[1][col] as Piece
      expect(piece).not.toBeNull()
      expect(piece.color).toBe('black')
      expect(piece.type).toBe('pawn')
    }
  })

  it('has empty middle rows (2-5)', () => {
    const board = createInitialBoard()
    for (let row = 2; row <= 5; row++) {
      for (let col = 0; col < 8; col++) {
        expect(board[row][col]).toBeNull()
      }
    }
  })

  it('places white pawns on row 6', () => {
    const board = createInitialBoard()
    for (let col = 0; col < 8; col++) {
      const piece = board[6][col] as Piece
      expect(piece).not.toBeNull()
      expect(piece.color).toBe('white')
      expect(piece.type).toBe('pawn')
    }
  })

  it('places white back rank on row 7', () => {
    const board = createInitialBoard()
    const expectedTypes = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    for (let col = 0; col < 8; col++) {
      const piece = board[7][col] as Piece
      expect(piece).not.toBeNull()
      expect(piece.color).toBe('white')
      expect(piece.type).toBe(expectedTypes[col])
    }
  })
})

describe('createInitialState', () => {
  it('starts with white to move', () => {
    const state = createInitialState()
    expect(state.turn).toBe('white')
  })

  it('has all castling rights enabled', () => {
    const state = createInitialState()
    expect(state.castlingRights.whiteKingSide).toBe(true)
    expect(state.castlingRights.whiteQueenSide).toBe(true)
    expect(state.castlingRights.blackKingSide).toBe(true)
    expect(state.castlingRights.blackQueenSide).toBe(true)
  })

  it('has no en passant target', () => {
    const state = createInitialState()
    expect(state.enPassantTarget).toBeNull()
  })

  it('has half-move clock at 0', () => {
    const state = createInitialState()
    expect(state.halfMoveClock).toBe(0)
  })

  it('has empty move history', () => {
    const state = createInitialState()
    expect(state.moveHistory).toHaveLength(0)
  })
})

describe('cloneBoard', () => {
  it('creates a deep copy of the board', () => {
    const board = createInitialBoard()
    const cloned = cloneBoard(board)
    expect(cloned).toEqual(board)
    // Mutating the clone should not affect the original
    cloned[0][0] = null
    expect(board[0][0]).not.toBeNull()
  })
})

describe('opponent', () => {
  it('returns black for white', () => {
    expect(opponent('white')).toBe('black')
  })

  it('returns white for black', () => {
    expect(opponent('black')).toBe('white')
  })
})
