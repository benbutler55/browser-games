export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export type TetrisBoard = number[][]
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
export type Piece = {
  type: PieceType
  shape: number[][]
  x: number
  y: number
  rotation: number
}

export const PIECES: Record<PieceType, number[][][]> = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
}

const PIECE_COLORS: Record<PieceType, number> = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
}

const PIECE_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

export function createBoard(): TetrisBoard {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0))
}

export function spawnPiece(type: PieceType): Piece {
  const shape = PIECES[type][0]
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2)
  return { type, shape, x, y: 0, rotation: 0 }
}

export function movePiece(piece: Piece, dx: number, dy: number): Piece {
  return { ...piece, x: piece.x + dx, y: piece.y + dy }
}

export function rotatePiece(piece: Piece): Piece {
  const nextRotation = (piece.rotation + 1) % 4
  const shape = PIECES[piece.type][nextRotation]
  return { ...piece, shape, rotation: nextRotation }
}

export function hasCollision(board: TetrisBoard, piece: Piece): boolean {
  const { shape, x, y } = piece
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardX = x + col
        const boardY = y + row
        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
          return true
        }
        if (boardY >= 0 && board[boardY][boardX] !== 0) {
          return true
        }
      }
    }
  }
  return false
}

export function lockPiece(board: TetrisBoard, piece: Piece): TetrisBoard {
  const newBoard = board.map((row) => [...row])
  const color = PIECE_COLORS[piece.type]
  const { shape, x, y } = piece
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardY = y + row
        const boardX = x + col
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = color
        }
      }
    }
  }
  return newBoard
}

export function clearLines(board: TetrisBoard): { board: TetrisBoard; linesCleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === 0))
  const linesCleared = BOARD_HEIGHT - remaining.length
  if (linesCleared === 0) return { board, linesCleared: 0 }
  const emptyRows = Array.from({ length: linesCleared }, () => Array(BOARD_WIDTH).fill(0))
  return { board: [...emptyRows, ...remaining], linesCleared }
}

export function getRandomPiece(): PieceType {
  return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]
}

export function getGhostY(board: TetrisBoard, piece: Piece): number {
  let ghostY = piece.y
  while (!hasCollision(board, { ...piece, y: ghostY + 1 })) {
    ghostY++
  }
  return ghostY
}

export function calculateScore(linesCleared: number, level: number): number {
  const points = [0, 100, 300, 500, 800]
  return (points[linesCleared] ?? 0) * (level + 1)
}
