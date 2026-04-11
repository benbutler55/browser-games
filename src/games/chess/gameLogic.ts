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

const KNIGHT_OFFSETS: [number, number][] = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
]
const ROOK_DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const BISHOP_DIRS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
const KING_OFFSETS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
]

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

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

export function findKing(board: Board, color: Color): Position {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.type === 'king' && piece.color === color) {
        return [r, c]
      }
    }
  }
  throw new Error(`No ${color} king found on board`)
}

export function isSquareAttacked(board: Board, pos: Position, byColor: Color): boolean {
  const [row, col] = pos

  // Knight attacks
  for (const [dr, dc] of KNIGHT_OFFSETS) {
    const r = row + dr
    const c = col + dc
    if (inBounds(r, c)) {
      const piece = board[r][c]
      if (piece && piece.color === byColor && piece.type === 'knight') {
        return true
      }
    }
  }

  // Sliding attacks (rook/bishop/queen)
  for (const [dr, dc] of ROOK_DIRS) {
    for (let dist = 1; dist < 8; dist++) {
      const r = row + dr * dist
      const c = col + dc * dist
      if (!inBounds(r, c)) break
      const piece = board[r][c]
      if (piece) {
        if (piece.color === byColor && (piece.type === 'rook' || piece.type === 'queen')) {
          return true
        }
        break
      }
    }
  }

  for (const [dr, dc] of BISHOP_DIRS) {
    for (let dist = 1; dist < 8; dist++) {
      const r = row + dr * dist
      const c = col + dc * dist
      if (!inBounds(r, c)) break
      const piece = board[r][c]
      if (piece) {
        if (piece.color === byColor && (piece.type === 'bishop' || piece.type === 'queen')) {
          return true
        }
        break
      }
    }
  }

  // King attacks (adjacent squares)
  for (const [dr, dc] of KING_OFFSETS) {
    const r = row + dr
    const c = col + dc
    if (inBounds(r, c)) {
      const piece = board[r][c]
      if (piece && piece.color === byColor && piece.type === 'king') {
        return true
      }
    }
  }

  // Pawn attacks
  const pawnDir = byColor === 'white' ? 1 : -1 // direction pawns of byColor attack FROM
  for (const dc of [-1, 1]) {
    const r = row + pawnDir
    const c = col + dc
    if (inBounds(r, c)) {
      const piece = board[r][c]
      if (piece && piece.color === byColor && piece.type === 'pawn') {
        return true
      }
    }
  }

  return false
}

export function isInCheck(board: Board, color: Color): boolean {
  const kingPos = findKing(board, color)
  return isSquareAttacked(board, kingPos, opponent(color))
}

function addSlidingMoves(
  board: Board,
  from: Position,
  color: Color,
  directions: [number, number][],
  moves: Move[],
): void {
  const [row, col] = from
  for (const [dr, dc] of directions) {
    for (let dist = 1; dist < 8; dist++) {
      const r = row + dr * dist
      const c = col + dc * dist
      if (!inBounds(r, c)) break
      const target = board[r][c]
      if (target) {
        if (target.color !== color) {
          moves.push({ from, to: [r, c] })
        }
        break
      }
      moves.push({ from, to: [r, c] })
    }
  }
}

function addPawnMoves(
  state: GameState,
  from: Position,
  moves: Move[],
): void {
  const { board, enPassantTarget } = state
  const piece = board[from[0]][from[1]]!
  const color = piece.color
  const [row, col] = from
  const dir = color === 'white' ? -1 : 1
  const startRow = color === 'white' ? 6 : 1
  const promotionRow = color === 'white' ? 0 : 7

  const addMoveOrPromotion = (to: Position, enPassant?: boolean) => {
    if (to[0] === promotionRow) {
      const promoPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight']
      for (const promotion of promoPieces) {
        moves.push({ from, to, promotion })
      }
    } else {
      const move: Move = { from, to }
      if (enPassant) move.enPassant = true
      moves.push(move)
    }
  }

  // Forward one
  const oneAhead: Position = [row + dir, col]
  if (inBounds(oneAhead[0], oneAhead[1]) && !board[oneAhead[0]][oneAhead[1]]) {
    addMoveOrPromotion(oneAhead)

    // Forward two from starting position
    if (row === startRow) {
      const twoAhead: Position = [row + 2 * dir, col]
      if (!board[twoAhead[0]][twoAhead[1]]) {
        moves.push({ from, to: twoAhead })
      }
    }
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const r = row + dir
    const c = col + dc
    if (!inBounds(r, c)) continue

    const target = board[r][c]
    if (target && target.color !== color) {
      addMoveOrPromotion([r, c])
    }

    // En passant
    if (enPassantTarget && enPassantTarget[0] === r && enPassantTarget[1] === c) {
      addMoveOrPromotion([r, c], true)
    }
  }
}

export function getRawMoves(state: GameState, from: Position): Move[] {
  const { board } = state
  const piece = board[from[0]][from[1]]
  if (!piece) return []

  const color = piece.color
  const moves: Move[] = []

  switch (piece.type) {
    case 'rook': {
      addSlidingMoves(board, from, color, ROOK_DIRS, moves)
      break
    }
    case 'bishop': {
      addSlidingMoves(board, from, color, BISHOP_DIRS, moves)
      break
    }
    case 'queen': {
      addSlidingMoves(board, from, color, [...ROOK_DIRS, ...BISHOP_DIRS], moves)
      break
    }
    case 'knight': {
      for (const [dr, dc] of KNIGHT_OFFSETS) {
        const r = from[0] + dr
        const c = from[1] + dc
        if (inBounds(r, c)) {
          const target = board[r][c]
          if (!target || target.color !== color) {
            moves.push({ from, to: [r, c] })
          }
        }
      }
      break
    }
    case 'king': {
      // Normal king moves
      for (const [dr, dc] of KING_OFFSETS) {
        const r = from[0] + dr
        const c = from[1] + dc
        if (inBounds(r, c)) {
          const target = board[r][c]
          if (!target || target.color !== color) {
            moves.push({ from, to: [r, c] })
          }
        }
      }

      // Castling
      const enemyColor = opponent(color)
      const backRank = color === 'white' ? 7 : 0

      // Only castle if king is on its starting square and not in check
      if (from[0] === backRank && from[1] === 4 && !isSquareAttacked(board, from, enemyColor)) {
        // Kingside
        const canKingside = color === 'white'
          ? state.castlingRights.whiteKingSide
          : state.castlingRights.blackKingSide

        if (canKingside) {
          const pathClear = !board[backRank][5] && !board[backRank][6]
          const passThrough = !isSquareAttacked(board, [backRank, 5], enemyColor)
          const landingSquare = !isSquareAttacked(board, [backRank, 6], enemyColor)
          if (pathClear && passThrough && landingSquare) {
            moves.push({ from, to: [backRank, 6], castle: 'kingside' })
          }
        }

        // Queenside
        const canQueenside = color === 'white'
          ? state.castlingRights.whiteQueenSide
          : state.castlingRights.blackQueenSide

        if (canQueenside) {
          const pathClear = !board[backRank][1] && !board[backRank][2] && !board[backRank][3]
          const passThrough = !isSquareAttacked(board, [backRank, 3], enemyColor)
          const landingSquare = !isSquareAttacked(board, [backRank, 2], enemyColor)
          if (pathClear && passThrough && landingSquare) {
            moves.push({ from, to: [backRank, 2], castle: 'queenside' })
          }
        }
      }
      break
    }
    case 'pawn': {
      addPawnMoves(state, from, moves)
      break
    }
  }

  return moves
}

export function applyMove(state: GameState, move: Move): GameState {
  const board = cloneBoard(state.board)
  const { from, to } = move
  const piece = board[from[0]][from[1]]!
  const captured = board[to[0]][to[1]]

  // Move the piece
  board[to[0]][to[1]] = piece
  board[from[0]][from[1]] = null

  // Handle promotion
  if (move.promotion) {
    board[to[0]][to[1]] = { type: move.promotion, color: piece.color }
  }

  // Handle en passant capture
  if (move.enPassant) {
    // The captured pawn is on the same row as the moving pawn, same col as destination
    board[from[0]][to[1]] = null
  }

  // Handle castling - move the rook
  if (move.castle) {
    const backRank = from[0]
    if (move.castle === 'kingside') {
      board[backRank][5] = board[backRank][7]
      board[backRank][7] = null
    } else {
      board[backRank][3] = board[backRank][0]
      board[backRank][0] = null
    }
  }

  // Update castling rights
  const newCastlingRights = { ...state.castlingRights }

  // King moves revoke both castling rights for that color
  if (piece.type === 'king') {
    if (piece.color === 'white') {
      newCastlingRights.whiteKingSide = false
      newCastlingRights.whiteQueenSide = false
    } else {
      newCastlingRights.blackKingSide = false
      newCastlingRights.blackQueenSide = false
    }
  }

  // Rook moves revoke the relevant castling right
  if (piece.type === 'rook') {
    if (from[0] === 7 && from[1] === 7) newCastlingRights.whiteKingSide = false
    if (from[0] === 7 && from[1] === 0) newCastlingRights.whiteQueenSide = false
    if (from[0] === 0 && from[1] === 7) newCastlingRights.blackKingSide = false
    if (from[0] === 0 && from[1] === 0) newCastlingRights.blackQueenSide = false
  }

  // Rook captured on starting square revokes castling right
  if (captured) {
    if (to[0] === 7 && to[1] === 7) newCastlingRights.whiteKingSide = false
    if (to[0] === 7 && to[1] === 0) newCastlingRights.whiteQueenSide = false
    if (to[0] === 0 && to[1] === 7) newCastlingRights.blackKingSide = false
    if (to[0] === 0 && to[1] === 0) newCastlingRights.blackQueenSide = false
  }

  // Update en passant target
  let enPassantTarget: Position | null = null
  if (piece.type === 'pawn' && Math.abs(to[0] - from[0]) === 2) {
    enPassantTarget = [(from[0] + to[0]) / 2, from[1]]
  }

  // Update half-move clock
  const isCapture = captured !== null || move.enPassant === true
  const isPawnMove = piece.type === 'pawn'
  const halfMoveClock = (isPawnMove || isCapture) ? 0 : state.halfMoveClock + 1

  return {
    board,
    turn: opponent(state.turn),
    castlingRights: newCastlingRights,
    enPassantTarget,
    halfMoveClock,
    moveHistory: [...state.moveHistory, move],
  }
}

export function getLegalMoves(state: GameState, from: Position): Move[] {
  const piece = state.board[from[0]][from[1]]
  if (!piece || piece.color !== state.turn) return []

  const rawMoves = getRawMoves(state, from)
  return rawMoves.filter((move) => {
    const newState = applyMove(state, move)
    // After the move, check if our own king is in check
    // Note: applyMove switches the turn, so we check from the perspective of the side that just moved
    return !isInCheck(newState.board, state.turn)
  })
}

export function getAllLegalMoves(state: GameState): Move[] {
  const moves: Move[] = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = state.board[r][c]
      if (piece && piece.color === state.turn) {
        moves.push(...getLegalMoves(state, [r, c]))
      }
    }
  }
  return moves
}

export type GameResult =
  | { type: 'checkmate'; winner: Color }
  | { type: 'stalemate' }
  | { type: 'insufficient_material' }

export function hasInsufficientMaterial(board: Board): boolean {
  const pieces: Piece[] = []
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        pieces.push(piece)
      }
    }
  }

  // K vs K
  if (pieces.length === 2) return true

  // K+B vs K or K+N vs K
  if (pieces.length === 3) {
    const nonKing = pieces.find((p) => p.type !== 'king')
    if (nonKing && (nonKing.type === 'bishop' || nonKing.type === 'knight')) {
      return true
    }
  }

  return false
}

export function getGameResult(state: GameState): GameResult | null {
  // Check for insufficient material first (can happen regardless of whose turn it is)
  if (hasInsufficientMaterial(state.board)) {
    return { type: 'insufficient_material' }
  }

  const legalMoves = getAllLegalMoves(state)

  if (legalMoves.length === 0) {
    // No legal moves — is it checkmate or stalemate?
    if (isInCheck(state.board, state.turn)) {
      return { type: 'checkmate', winner: opponent(state.turn) }
    }
    return { type: 'stalemate' }
  }

  return null
}
