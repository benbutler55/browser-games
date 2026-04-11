import { describe, it, expect } from 'vitest'
import {
  createInitialBoard,
  createInitialState,
  cloneBoard,
  opponent,
  getRawMoves,
  getLegalMoves,
  getAllLegalMoves,
  isSquareAttacked,
  findKing,
  isInCheck,
  applyMove,
  getGameResult,
  hasInsufficientMaterial,
  type Board,
  type Piece,
  type GameState,
  type Move,
  type Position,
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

// Helper: create an empty 8x8 board
function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null))
}

// Helper: create a minimal game state from a board
function stateFromBoard(board: Board, turn: 'white' | 'black' = 'white'): GameState {
  return {
    board,
    turn,
    castlingRights: {
      whiteKingSide: false,
      whiteQueenSide: false,
      blackKingSide: false,
      blackQueenSide: false,
    },
    enPassantTarget: null,
    halfMoveClock: 0,
    moveHistory: [],
  }
}

describe('getRawMoves', () => {
  it('knight from center (4,4) has 8 moves', () => {
    const board = emptyBoard()
    board[4][4] = { type: 'knight', color: 'white' }
    // Need a king on the board for the state to be valid
    board[7][4] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const moves = getRawMoves(state, [4, 4])
    expect(moves).toHaveLength(8)
  })

  it('knight from corner (0,0) has 2 moves', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'knight', color: 'white' }
    board[7][4] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const moves = getRawMoves(state, [0, 0])
    expect(moves).toHaveLength(2)
  })

  it('rook on empty board from center (4,4) has 14 moves', () => {
    const board = emptyBoard()
    board[4][4] = { type: 'rook', color: 'white' }
    board[7][0] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const moves = getRawMoves(state, [4, 4])
    expect(moves).toHaveLength(14)
  })

  it('bishop on empty board from center (4,4) has 13 moves', () => {
    const board = emptyBoard()
    board[4][4] = { type: 'bishop', color: 'white' }
    board[7][0] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const moves = getRawMoves(state, [4, 4])
    expect(moves).toHaveLength(13)
  })

  it('queen on empty board from center (4,4) has 27 moves', () => {
    const board = emptyBoard()
    board[4][4] = { type: 'queen', color: 'white' }
    board[7][0] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const moves = getRawMoves(state, [4, 4])
    expect(moves).toHaveLength(27)
  })

  it('king from center (4,4) has 8 moves (no castling)', () => {
    const board = emptyBoard()
    board[4][4] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const moves = getRawMoves(state, [4, 4])
    expect(moves).toHaveLength(8)
  })

  it('white pawn on starting rank has 2 moves', () => {
    const board = emptyBoard()
    board[6][3] = { type: 'pawn', color: 'white' }
    board[7][4] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const moves = getRawMoves(state, [6, 3])
    expect(moves).toHaveLength(2)
  })

  it('white pawn captures diagonally', () => {
    const board = emptyBoard()
    board[4][3] = { type: 'pawn', color: 'white' }
    board[3][2] = { type: 'pawn', color: 'black' }
    board[3][4] = { type: 'pawn', color: 'black' }
    board[7][4] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const moves = getRawMoves(state, [4, 3])
    // 1 forward + 2 diagonal captures = 3
    expect(moves).toHaveLength(3)
  })

  it('pawn promotion generates 4 moves per target square', () => {
    const board = emptyBoard()
    board[1][3] = { type: 'pawn', color: 'white' }
    board[7][4] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const moves = getRawMoves(state, [1, 3])
    // 1 target square (forward) * 4 promotion pieces = 4
    expect(moves).toHaveLength(4)
    expect(moves.every((m: Move) => m.promotion !== undefined)).toBe(true)
  })

  it('pawn en passant capture', () => {
    const board = emptyBoard()
    board[3][3] = { type: 'pawn', color: 'white' }
    board[3][4] = { type: 'pawn', color: 'black' }
    board[7][4] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    state.enPassantTarget = [2, 4]
    const moves = getRawMoves(state, [3, 3])
    // 1 forward + 1 en passant capture = 2
    expect(moves).toHaveLength(2)
    const epMove = moves.find((m: Move) => m.to[1] === 4)
    expect(epMove?.enPassant).toBe(true)
  })
})

describe('findKing', () => {
  it('finds white king on initial board', () => {
    const board = createInitialBoard()
    const pos = findKing(board, 'white')
    expect(pos).toEqual([7, 4])
  })

  it('finds black king on initial board', () => {
    const board = createInitialBoard()
    const pos = findKing(board, 'black')
    expect(pos).toEqual([0, 4])
  })
})

describe('isSquareAttacked', () => {
  it('detects rook attack on an open file', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'rook', color: 'black' }
    board[4][0] = { type: 'king', color: 'white' }
    expect(isSquareAttacked(board, [4, 0], 'black')).toBe(true)
  })

  it('returns false when no attack exists', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'rook', color: 'black' }
    board[4][4] = { type: 'king', color: 'white' }
    expect(isSquareAttacked(board, [4, 4], 'black')).toBe(false)
  })
})

describe('isInCheck', () => {
  it('detects check from rook', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[0][4] = { type: 'rook', color: 'black' }
    expect(isInCheck(board, 'white')).toBe(true)
  })

  it('returns false when not in check', () => {
    const board = createInitialBoard()
    expect(isInCheck(board, 'white')).toBe(false)
  })
})

describe('getAllLegalMoves', () => {
  it('starting position has 20 legal moves for white', () => {
    const state = createInitialState()
    const moves = getAllLegalMoves(state)
    expect(moves).toHaveLength(20)
  })
})

describe('getLegalMoves', () => {
  it('filters out moves that leave king in check', () => {
    const board = emptyBoard()
    // White king at e1 (7,4), black rook at e8 (0,4)
    // A white piece on e2 (6,4) is pinned to the king
    board[7][4] = { type: 'king', color: 'white' }
    board[0][4] = { type: 'rook', color: 'black' }
    board[6][4] = { type: 'knight', color: 'white' }
    const state = stateFromBoard(board)
    // The knight is pinned; no legal moves
    const moves = getLegalMoves(state, [6, 4])
    expect(moves).toHaveLength(0)
  })
})

describe('applyMove', () => {
  it('moves a piece from one square to another', () => {
    const state = createInitialState()
    const move: Move = { from: [6, 4], to: [4, 4] } // e2-e4
    const newState = applyMove(state, move)
    expect(newState.board[4][4]).toEqual({ type: 'pawn', color: 'white' })
    expect(newState.board[6][4]).toBeNull()
  })

  it('switches the turn', () => {
    const state = createInitialState()
    const move: Move = { from: [6, 4], to: [4, 4] }
    const newState = applyMove(state, move)
    expect(newState.turn).toBe('black')
  })

  it('sets en passant target for double pawn push', () => {
    const state = createInitialState()
    const move: Move = { from: [6, 4], to: [4, 4] }
    const newState = applyMove(state, move)
    expect(newState.enPassantTarget).toEqual([5, 4])
  })

  it('handles en passant capture', () => {
    const board = emptyBoard()
    board[3][3] = { type: 'pawn', color: 'white' }
    board[3][4] = { type: 'pawn', color: 'black' }
    board[7][4] = { type: 'king', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.enPassantTarget = [2, 4]
    const move: Move = { from: [3, 3], to: [2, 4], enPassant: true }
    const newState = applyMove(state, move)
    // Pawn should be at the new position
    expect(newState.board[2][4]).toEqual({ type: 'pawn', color: 'white' })
    // Captured pawn should be removed
    expect(newState.board[3][4]).toBeNull()
  })

  it('handles promotion', () => {
    const board = emptyBoard()
    board[1][0] = { type: 'pawn', color: 'white' }
    board[7][4] = { type: 'king', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    const move: Move = { from: [1, 0], to: [0, 0], promotion: 'queen' }
    const newState = applyMove(state, move)
    expect(newState.board[0][0]).toEqual({ type: 'queen', color: 'white' })
  })

  it('handles kingside castling', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[7][7] = { type: 'rook', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.castlingRights.whiteKingSide = true
    const move: Move = { from: [7, 4], to: [7, 6], castle: 'kingside' }
    const newState = applyMove(state, move)
    expect(newState.board[7][6]).toEqual({ type: 'king', color: 'white' })
    expect(newState.board[7][5]).toEqual({ type: 'rook', color: 'white' })
    expect(newState.board[7][4]).toBeNull()
    expect(newState.board[7][7]).toBeNull()
  })

  it('handles queenside castling', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[7][0] = { type: 'rook', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.castlingRights.whiteQueenSide = true
    const move: Move = { from: [7, 4], to: [7, 2], castle: 'queenside' }
    const newState = applyMove(state, move)
    expect(newState.board[7][2]).toEqual({ type: 'king', color: 'white' })
    expect(newState.board[7][3]).toEqual({ type: 'rook', color: 'white' })
    expect(newState.board[7][4]).toBeNull()
    expect(newState.board[7][0]).toBeNull()
  })

  it('revokes castling rights when king moves', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[7][0] = { type: 'rook', color: 'white' }
    board[7][7] = { type: 'rook', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.castlingRights.whiteKingSide = true
    state.castlingRights.whiteQueenSide = true
    const move: Move = { from: [7, 4], to: [7, 5] }
    const newState = applyMove(state, move)
    expect(newState.castlingRights.whiteKingSide).toBe(false)
    expect(newState.castlingRights.whiteQueenSide).toBe(false)
  })

  it('revokes castling right when rook moves', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[7][7] = { type: 'rook', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.castlingRights.whiteKingSide = true
    const move: Move = { from: [7, 7], to: [6, 7] }
    const newState = applyMove(state, move)
    expect(newState.castlingRights.whiteKingSide).toBe(false)
  })

  it('resets half-move clock on pawn move', () => {
    const state = createInitialState()
    state.halfMoveClock = 5
    const move: Move = { from: [6, 4], to: [4, 4] }
    const newState = applyMove(state, move)
    expect(newState.halfMoveClock).toBe(0)
  })

  it('resets half-move clock on capture', () => {
    const board = emptyBoard()
    board[4][4] = { type: 'knight', color: 'white' }
    board[3][3] = { type: 'pawn', color: 'black' }
    board[7][4] = { type: 'king', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.halfMoveClock = 10
    const move: Move = { from: [4, 4], to: [3, 3] } // captures pawn, not a pawn move but is a capture
    const newState = applyMove(state, move)
    expect(newState.halfMoveClock).toBe(0)
  })

  it('increments half-move clock on non-pawn non-capture move', () => {
    const board = emptyBoard()
    board[4][4] = { type: 'knight', color: 'white' }
    board[7][4] = { type: 'king', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.halfMoveClock = 3
    const move: Move = { from: [4, 4], to: [2, 5] }
    const newState = applyMove(state, move)
    expect(newState.halfMoveClock).toBe(4)
  })

  it('adds move to history', () => {
    const state = createInitialState()
    const move: Move = { from: [6, 4], to: [4, 4] }
    const newState = applyMove(state, move)
    expect(newState.moveHistory).toHaveLength(1)
    expect(newState.moveHistory[0]).toEqual(move)
  })

  it('revokes castling right when rook is captured on starting square', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    board[0][7] = { type: 'rook', color: 'black' }
    board[2][5] = { type: 'bishop', color: 'white' }
    const state = stateFromBoard(board)
    state.castlingRights.blackKingSide = true
    // White bishop captures the black kingside rook
    const move: Move = { from: [2, 5], to: [0, 7] }
    const newState = applyMove(state, move)
    expect(newState.castlingRights.blackKingSide).toBe(false)
  })
})

describe('castling move generation', () => {
  it('generates kingside castling when available', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[7][7] = { type: 'rook', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.castlingRights.whiteKingSide = true
    const moves = getRawMoves(state, [7, 4])
    const castleMove = moves.find((m: Move) => m.castle === 'kingside')
    expect(castleMove).toBeDefined()
    expect(castleMove!.to).toEqual([7, 6])
  })

  it('generates queenside castling when available', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[7][0] = { type: 'rook', color: 'white' }
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.castlingRights.whiteQueenSide = true
    const moves = getRawMoves(state, [7, 4])
    const castleMove = moves.find((m: Move) => m.castle === 'queenside')
    expect(castleMove).toBeDefined()
    expect(castleMove!.to).toEqual([7, 2])
  })

  it('does not generate castling when pieces are in the way', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[7][7] = { type: 'rook', color: 'white' }
    board[7][5] = { type: 'bishop', color: 'white' } // blocking
    board[0][4] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.castlingRights.whiteKingSide = true
    const moves = getRawMoves(state, [7, 4])
    const castleMove = moves.find((m: Move) => m.castle === 'kingside')
    expect(castleMove).toBeUndefined()
  })

  it('does not generate castling when king is in check', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[7][7] = { type: 'rook', color: 'white' }
    board[0][4] = { type: 'rook', color: 'black' } // giving check
    const state = stateFromBoard(board)
    state.castlingRights.whiteKingSide = true
    const moves = getRawMoves(state, [7, 4])
    const castleMove = moves.find((m: Move) => m.castle === 'kingside')
    expect(castleMove).toBeUndefined()
  })

  it('does not generate castling when king passes through attacked square', () => {
    const board = emptyBoard()
    board[7][4] = { type: 'king', color: 'white' }
    board[7][7] = { type: 'rook', color: 'white' }
    board[0][5] = { type: 'rook', color: 'black' } // attacks f1
    board[0][0] = { type: 'king', color: 'black' }
    const state = stateFromBoard(board)
    state.castlingRights.whiteKingSide = true
    const moves = getRawMoves(state, [7, 4])
    const castleMove = moves.find((m: Move) => m.castle === 'kingside')
    expect(castleMove).toBeUndefined()
  })
})

describe('getGameResult', () => {
  it('returns null for starting position (game ongoing)', () => {
    const state = createInitialState()
    expect(getGameResult(state)).toBeNull()
  })

  it('detects fool\'s mate (checkmate for black)', () => {
    // 1. f3 e5 2. g4 Qh4#
    let state = createInitialState()
    // 1. f3
    state = applyMove(state, { from: [6, 5], to: [5, 5] })
    // 1... e5
    state = applyMove(state, { from: [1, 4], to: [3, 4] })
    // 2. g4
    state = applyMove(state, { from: [6, 6], to: [4, 6] })
    // 2... Qh4#
    state = applyMove(state, { from: [0, 3], to: [4, 7] })

    const result = getGameResult(state)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('checkmate')
    if (result!.type === 'checkmate') {
      expect(result!.winner).toBe('black')
    }
  })

  it('detects stalemate (K at a8, Q at b6, K at c2, black to move)', () => {
    // Black king at a8 (0,0), white queen at b6 (2,1), white king at c2 (6,2)
    // Black to move — no legal moves but not in check = stalemate
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[2][1] = { type: 'queen', color: 'white' }
    board[6][2] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board, 'black')
    const result = getGameResult(state)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('stalemate')
  })

  it('detects insufficient material: K vs K', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[7][7] = { type: 'king', color: 'white' }
    const state = stateFromBoard(board)
    const result = getGameResult(state)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('insufficient_material')
  })

  it('detects insufficient material: K+B vs K', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[7][7] = { type: 'king', color: 'white' }
    board[3][3] = { type: 'bishop', color: 'white' }
    const state = stateFromBoard(board)
    const result = getGameResult(state)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('insufficient_material')
  })

  it('detects insufficient material: K+N vs K', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[7][7] = { type: 'king', color: 'white' }
    board[3][3] = { type: 'knight', color: 'black' }
    const state = stateFromBoard(board)
    const result = getGameResult(state)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('insufficient_material')
  })

  it('does not detect insufficient material with a pawn on the board', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[7][7] = { type: 'king', color: 'white' }
    board[3][3] = { type: 'pawn', color: 'white' }
    const state = stateFromBoard(board)
    const result = getGameResult(state)
    // Game is ongoing (not insufficient material)
    expect(result).toBeNull()
  })
})

describe('hasInsufficientMaterial', () => {
  it('returns true for K vs K', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[7][7] = { type: 'king', color: 'white' }
    expect(hasInsufficientMaterial(board)).toBe(true)
  })

  it('returns true for K+B vs K', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[7][7] = { type: 'king', color: 'white' }
    board[4][4] = { type: 'bishop', color: 'white' }
    expect(hasInsufficientMaterial(board)).toBe(true)
  })

  it('returns true for K+N vs K', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[7][7] = { type: 'king', color: 'white' }
    board[4][4] = { type: 'knight', color: 'black' }
    expect(hasInsufficientMaterial(board)).toBe(true)
  })

  it('returns false for K+R vs K', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[7][7] = { type: 'king', color: 'white' }
    board[4][4] = { type: 'rook', color: 'white' }
    expect(hasInsufficientMaterial(board)).toBe(false)
  })

  it('returns false for K+Q vs K', () => {
    const board = emptyBoard()
    board[0][0] = { type: 'king', color: 'black' }
    board[7][7] = { type: 'king', color: 'white' }
    board[4][4] = { type: 'queen', color: 'white' }
    expect(hasInsufficientMaterial(board)).toBe(false)
  })

  it('returns false for starting position', () => {
    expect(hasInsufficientMaterial(createInitialBoard())).toBe(false)
  })
})
