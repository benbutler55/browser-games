import { describe, it, expect } from 'vitest'
import {
  createBoard,
  spawnPiece,
  movePiece,
  rotatePiece,
  hasCollision,
  lockPiece,
  clearLines,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from './gameLogic'

describe('createBoard', () => {
  it('creates a 20x10 board of zeros', () => {
    const board = createBoard()
    expect(board).toHaveLength(BOARD_HEIGHT)
    expect(board[0]).toHaveLength(BOARD_WIDTH)
    for (const row of board) {
      for (const cell of row) {
        expect(cell).toBe(0)
      }
    }
  })
})

describe('spawnPiece', () => {
  it('creates a piece at top center', () => {
    const piece = spawnPiece('T')
    expect(piece.type).toBe('T')
    expect(piece.y).toBe(0)
    expect(piece.x).toBe(3)
    expect(piece.rotation).toBe(0)
  })

  it('centers the I piece', () => {
    const piece = spawnPiece('I')
    expect(piece.x).toBe(3)
    expect(piece.y).toBe(0)
  })
})

describe('movePiece', () => {
  it('moves left', () => {
    const piece = spawnPiece('T')
    const moved = movePiece(piece, -1, 0)
    expect(moved.x).toBe(piece.x - 1)
    expect(moved.y).toBe(piece.y)
  })

  it('moves down', () => {
    const piece = spawnPiece('T')
    const moved = movePiece(piece, 0, 1)
    expect(moved.x).toBe(piece.x)
    expect(moved.y).toBe(piece.y + 1)
  })
})

describe('rotatePiece', () => {
  it('changes shape on rotation', () => {
    const piece = spawnPiece('T')
    const rotated = rotatePiece(piece)
    expect(rotated.shape).not.toEqual(piece.shape)
    expect(rotated.rotation).toBe(1)
  })

  it('wraps rotation after 4', () => {
    let piece = spawnPiece('T')
    piece = rotatePiece(piece)
    piece = rotatePiece(piece)
    piece = rotatePiece(piece)
    piece = rotatePiece(piece)
    expect(piece.rotation).toBe(0)
    expect(piece.shape).toEqual(spawnPiece('T').shape)
  })
})

describe('hasCollision', () => {
  it('detects left wall collision', () => {
    const board = createBoard()
    const piece = spawnPiece('T')
    const moved = movePiece(piece, -4, 0)
    expect(hasCollision(board, moved)).toBe(true)
  })

  it('detects floor collision', () => {
    const board = createBoard()
    const piece = spawnPiece('T')
    const moved = movePiece(piece, 0, BOARD_HEIGHT)
    expect(hasCollision(board, moved)).toBe(true)
  })

  it('returns false for valid position', () => {
    const board = createBoard()
    const piece = spawnPiece('T')
    expect(hasCollision(board, piece)).toBe(false)
  })
})

describe('lockPiece', () => {
  it('places cells on the board with color value', () => {
    const board = createBoard()
    const piece = spawnPiece('T')
    const moved = movePiece(piece, 0, 1)
    const locked = lockPiece(board, moved)
    // T piece color is 3
    expect(locked[1][4]).toBe(3) // top center of T
    expect(locked[2][3]).toBe(3) // bottom row of T
    expect(locked[2][4]).toBe(3)
    expect(locked[2][5]).toBe(3)
  })
})

describe('clearLines', () => {
  it('clears full rows and returns count', () => {
    const board = createBoard()
    // Fill bottom row
    for (let col = 0; col < BOARD_WIDTH; col++) {
      board[BOARD_HEIGHT - 1][col] = 1
    }
    const result = clearLines(board)
    expect(result.linesCleared).toBe(1)
    // Bottom row should now be empty
    expect(result.board[BOARD_HEIGHT - 1].every((c) => c === 0)).toBe(true)
  })

  it('does not clear on empty board', () => {
    const board = createBoard()
    const result = clearLines(board)
    expect(result.linesCleared).toBe(0)
    expect(result.board).toBe(board) // same reference when no change
  })
})
