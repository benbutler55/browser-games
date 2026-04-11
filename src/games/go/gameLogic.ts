export type StoneColor = 'black' | 'white'
export type Cell = StoneColor | null
export type GoBoard = Cell[][]
export type Position = [number, number]

export interface GoState {
  board: GoBoard
  turn: StoneColor
  captures: { black: number; white: number }
  previousBoard: GoBoard | null
  consecutivePasses: number
  gameOver: boolean
  moveHistory: Position[]
}

const BOARD_SIZE = 9

export function createInitialState(): GoState {
  const board: GoBoard = Array.from({ length: BOARD_SIZE }, () =>
    Array<Cell>(BOARD_SIZE).fill(null)
  )
  return {
    board,
    turn: 'black',
    captures: { black: 0, white: 0 },
    previousBoard: null,
    consecutivePasses: 0,
    gameOver: false,
    moveHistory: [],
  }
}

export function cloneBoard(board: GoBoard): GoBoard {
  return board.map((row) => [...row])
}

export function opponentColor(color: StoneColor): StoneColor {
  return color === 'black' ? 'white' : 'black'
}

function getNeighbors(pos: Position): Position[] {
  const [row, col] = pos
  const neighbors: Position[] = []
  if (row > 0) neighbors.push([row - 1, col])
  if (row < BOARD_SIZE - 1) neighbors.push([row + 1, col])
  if (col > 0) neighbors.push([row, col - 1])
  if (col < BOARD_SIZE - 1) neighbors.push([row, col + 1])
  return neighbors
}

export function getGroup(board: GoBoard, pos: Position): Position[] {
  const [row, col] = pos
  const color = board[row][col]
  if (color === null) return []

  const group: Position[] = []
  const visited = new Set<string>()
  const stack: Position[] = [pos]

  while (stack.length > 0) {
    const current = stack.pop()!
    const key = `${current[0]},${current[1]}`
    if (visited.has(key)) continue
    visited.add(key)

    const [r, c] = current
    if (board[r][c] !== color) continue

    group.push(current)
    for (const neighbor of getNeighbors(current)) {
      const nKey = `${neighbor[0]},${neighbor[1]}`
      if (!visited.has(nKey)) {
        stack.push(neighbor)
      }
    }
  }

  return group
}

export function getLiberties(board: GoBoard, pos: Position): number {
  const group = getGroup(board, pos)
  if (group.length === 0) return 0

  const liberties = new Set<string>()
  for (const stone of group) {
    for (const neighbor of getNeighbors(stone)) {
      const [r, c] = neighbor
      if (board[r][c] === null) {
        liberties.add(`${r},${c}`)
      }
    }
  }

  return liberties.size
}
