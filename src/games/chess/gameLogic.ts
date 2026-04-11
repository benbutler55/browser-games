export type Color = 'white' | 'black'
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'

export type Piece = {
  type: PieceType
  color: Color
}

export type Cell = Piece | null
export type Board = Cell[][]
export type Position = [number, number]

export type Move = {
  from: Position
  to: Position
  promotion?: PieceType
  castle?: 'kingside' | 'queenside'
  enPassant?: boolean
}

export type CastlingRights = {
  whiteKingSide: boolean
  whiteQueenSide: boolean
  blackKingSide: boolean
  blackQueenSide: boolean
}

export type GameState = {
  board: Board
  turn: Color
  castlingRights: CastlingRights
  enPassantTarget: Position | null
  halfMoveClock: number
  moveHistory: Move[]
}

const BACK_RANK: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']

export function createInitialBoard(): Board {
  const board: Board = []

  // Row 0: black back rank
  board.push(BACK_RANK.map((type) => ({ type, color: 'black' as Color })))

  // Row 1: black pawns
  board.push(Array.from({ length: 8 }, () => ({ type: 'pawn' as PieceType, color: 'black' as Color })))

  // Rows 2-5: empty
  for (let i = 0; i < 4; i++) {
    board.push(Array.from({ length: 8 }, () => null))
  }

  // Row 6: white pawns
  board.push(Array.from({ length: 8 }, () => ({ type: 'pawn' as PieceType, color: 'white' as Color })))

  // Row 7: white back rank
  board.push(BACK_RANK.map((type) => ({ type, color: 'white' as Color })))

  return board
}

export function createInitialState(): GameState {
  return {
    board: createInitialBoard(),
    turn: 'white',
    castlingRights: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true,
    },
    enPassantTarget: null,
    halfMoveClock: 0,
    moveHistory: [],
  }
}

export function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => (cell ? { ...cell } : null))
  )
}

export function opponent(color: Color): Color {
  return color === 'white' ? 'black' : 'white'
}
