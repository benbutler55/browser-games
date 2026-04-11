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

export const BOARD_SIZE = 9

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

export function boardsEqual(a: GoBoard, b: GoBoard): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false
    }
  }
  return true
}

function removeGroup(board: GoBoard, group: Position[]): void {
  for (const [r, c] of group) {
    board[r][c] = null
  }
}

export function placeStone(state: GoState, pos: Position): GoState | null {
  if (state.gameOver) return null

  const [row, col] = pos

  // Must be within bounds
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null

  // Must be empty intersection
  if (state.board[row][col] !== null) return null

  const newBoard = cloneBoard(state.board)
  const currentColor = state.turn
  const opponent = opponentColor(currentColor)

  // Place the stone
  newBoard[row][col] = currentColor

  // Check opponent's adjacent groups and remove any with 0 liberties (capture)
  let capturedCount = 0
  const checkedGroups = new Set<string>()
  for (const neighbor of getNeighbors(pos)) {
    const [nr, nc] = neighbor
    if (newBoard[nr][nc] === opponent) {
      const groupKey = `${nr},${nc}`
      if (checkedGroups.has(groupKey)) continue
      const group = getGroup(newBoard, neighbor)
      // Mark all stones in this group as checked
      for (const stone of group) {
        checkedGroups.add(`${stone[0]},${stone[1]}`)
      }
      if (getLiberties(newBoard, neighbor) === 0) {
        capturedCount += group.length
        removeGroup(newBoard, group)
      }
    }
  }

  // Check own group — if 0 liberties after captures, move is illegal (suicide)
  if (getLiberties(newBoard, pos) === 0) {
    return null
  }

  // Check ko — if resulting board equals previousBoard, move is illegal
  if (state.previousBoard !== null && boardsEqual(newBoard, state.previousBoard)) {
    return null
  }

  return {
    board: newBoard,
    turn: opponent,
    captures: {
      ...state.captures,
      [currentColor]: state.captures[currentColor] + capturedCount,
    },
    previousBoard: cloneBoard(state.board),
    consecutivePasses: 0,
    gameOver: false,
    moveHistory: [...state.moveHistory, pos],
  }
}

export function pass(state: GoState): GoState {
  const newConsecutivePasses = state.consecutivePasses + 1
  return {
    board: state.board,
    turn: opponentColor(state.turn),
    captures: { ...state.captures },
    previousBoard: null,
    consecutivePasses: newConsecutivePasses,
    gameOver: newConsecutivePasses >= 2,
    moveHistory: [...state.moveHistory],
  }
}

function floodFillEmpty(
  board: GoBoard,
  start: Position,
  visited: Set<string>
): { cells: Position[]; borderColors: Set<StoneColor> } {
  const cells: Position[] = []
  const borderColors = new Set<StoneColor>()
  const stack: Position[] = [start]

  while (stack.length > 0) {
    const current = stack.pop()!
    const key = `${current[0]},${current[1]}`
    if (visited.has(key)) continue
    visited.add(key)

    const [r, c] = current
    const cell = board[r][c]

    if (cell !== null) {
      borderColors.add(cell)
      continue
    }

    cells.push(current)

    for (const neighbor of getNeighbors(current)) {
      const nKey = `${neighbor[0]},${neighbor[1]}`
      if (!visited.has(nKey)) {
        stack.push(neighbor)
      }
    }
  }

  return { cells, borderColors }
}

export function getTerritory(board: GoBoard): Cell[][] {
  const territory: Cell[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array<Cell>(BOARD_SIZE).fill(null)
  )

  const visited = new Set<string>()

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) continue
      const key = `${r},${c}`
      if (visited.has(key)) continue

      const { cells, borderColors } = floodFillEmpty(board, [r, c], visited)

      if (borderColors.size === 1) {
        const owner = [...borderColors][0]
        for (const [cr, cc] of cells) {
          territory[cr][cc] = owner
        }
      }
    }
  }

  return territory
}

export function calculateScore(board: GoBoard): { black: number; white: number } {
  let black = 0
  let white = 0

  // Count stones on board
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'black') black++
      else if (board[r][c] === 'white') white++
    }
  }

  // Count territory
  const territory = getTerritory(board)
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (territory[r][c] === 'black') black++
      else if (territory[r][c] === 'white') white++
    }
  }

  // Add komi for white
  white += 6.5

  return { black, white }
}
