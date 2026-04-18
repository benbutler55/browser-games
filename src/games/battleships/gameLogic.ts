export const BOARD_SIZE = 10
export const DEFAULT_FLEET = [5, 4, 3, 3, 2] as const

export type Orientation = 'horizontal' | 'vertical'
export type Position = [number, number]
export type ShotResult = 'miss' | 'hit' | 'sunk' | 'repeat'

export type Ship = {
  id: number
  length: number
  row: number
  col: number
  orientation: Orientation
}

export type BoardState = {
  size: number
  ships: Ship[]
  shots: Position[]
}

export type FireResult = {
  board: BoardState
  result: ShotResult
  targetShipId: number | null
  gameOver: boolean
}

export type VisibleCellState = 'water' | 'ship' | 'miss' | 'hit' | 'sunk'

function keyFor(row: number, col: number): string {
  return `${row},${col}`
}

function isSamePosition(a: Position, b: Position): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

export function createBoardState(size: number = BOARD_SIZE): BoardState {
  return {
    size,
    ships: [],
    shots: [],
  }
}

export function isInBounds(row: number, col: number, size: number = BOARD_SIZE): boolean {
  return row >= 0 && row < size && col >= 0 && col < size
}

export function getShipCells(ship: Ship): Position[] {
  const cells: Position[] = []

  for (let i = 0; i < ship.length; i++) {
    const row = ship.orientation === 'vertical' ? ship.row + i : ship.row
    const col = ship.orientation === 'horizontal' ? ship.col + i : ship.col
    cells.push([row, col])
  }

  return cells
}

export function getShipAtPosition(ships: Ship[], row: number, col: number): Ship | null {
  for (const ship of ships) {
    for (const [shipRow, shipCol] of getShipCells(ship)) {
      if (shipRow === row && shipCol === col) {
        return ship
      }
    }
  }

  return null
}

export function canPlaceShip(ships: Ship[], candidate: Ship, size: number = BOARD_SIZE): boolean {
  const occupied = new Set<string>()

  for (const ship of ships) {
    if (ship.id === candidate.id) continue
    for (const [row, col] of getShipCells(ship)) {
      occupied.add(keyFor(row, col))
    }
  }

  for (const [row, col] of getShipCells(candidate)) {
    if (!isInBounds(row, col, size)) {
      return false
    }
    if (occupied.has(keyFor(row, col))) {
      return false
    }
  }

  return true
}

export function upsertShip(
  ships: Ship[],
  candidate: Ship,
  size: number = BOARD_SIZE,
): Ship[] | null {
  if (!canPlaceShip(ships, candidate, size)) {
    return null
  }

  return [...ships.filter((ship) => ship.id !== candidate.id), candidate].sort(
    (a, b) => a.id - b.id,
  )
}

export function removeShip(ships: Ship[], shipId: number): Ship[] {
  return ships.filter((ship) => ship.id !== shipId)
}

export function isFleetPlaced(ships: Ship[], fleetLengths: readonly number[] = DEFAULT_FLEET): boolean {
  if (ships.length !== fleetLengths.length) {
    return false
  }

  for (let i = 0; i < fleetLengths.length; i++) {
    const ship = ships.find((current) => current.id === i)
    if (!ship || ship.length !== fleetLengths[i]) {
      return false
    }
  }

  return true
}

export function hasShotAt(shots: Position[], row: number, col: number): boolean {
  return shots.some((shot) => shot[0] === row && shot[1] === col)
}

export function isShipSunk(ship: Ship, shots: Position[]): boolean {
  const cells = getShipCells(ship)
  return cells.every(([row, col]) => hasShotAt(shots, row, col))
}

export function areAllShipsSunk(ships: Ship[], shots: Position[]): boolean {
  if (ships.length === 0) {
    return false
  }

  return ships.every((ship) => isShipSunk(ship, shots))
}

export function fireShot(board: BoardState, target: Position): FireResult {
  const [row, col] = target

  if (!isInBounds(row, col, board.size)) {
    throw new Error('Shot is out of bounds')
  }

  if (hasShotAt(board.shots, row, col)) {
    return {
      board,
      result: 'repeat',
      targetShipId: null,
      gameOver: areAllShipsSunk(board.ships, board.shots),
    }
  }

  const nextShots = [...board.shots, target]
  const hitShip = getShipAtPosition(board.ships, row, col)

  if (!hitShip) {
    return {
      board: {
        ...board,
        shots: nextShots,
      },
      result: 'miss',
      targetShipId: null,
      gameOver: false,
    }
  }

  const sunk = isShipSunk(hitShip, nextShots)
  const gameOver = areAllShipsSunk(board.ships, nextShots)

  return {
    board: {
      ...board,
      shots: nextShots,
    },
    result: sunk ? 'sunk' : 'hit',
    targetShipId: hitShip.id,
    gameOver,
  }
}

export function createRandomFleet(
  fleetLengths: readonly number[] = DEFAULT_FLEET,
  size: number = BOARD_SIZE,
): Ship[] {
  const ships: Ship[] = []

  for (let id = 0; id < fleetLengths.length; id++) {
    const length = fleetLengths[id]
    let placed = false

    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical'
      const row = Math.floor(Math.random() * size)
      const col = Math.floor(Math.random() * size)
      const candidate: Ship = {
        id,
        length,
        row,
        col,
        orientation,
      }

      if (canPlaceShip(ships, candidate, size)) {
        ships.push(candidate)
        placed = true
      }
    }

    if (!placed) {
      throw new Error('Unable to generate random fleet after many attempts')
    }
  }

  return ships.sort((a, b) => a.id - b.id)
}

export function getVisibleCellState(
  board: BoardState,
  row: number,
  col: number,
  revealShips: boolean,
): VisibleCellState {
  const ship = getShipAtPosition(board.ships, row, col)
  const wasShot = hasShotAt(board.shots, row, col)

  if (!wasShot) {
    if (revealShips && ship) {
      return 'ship'
    }
    return 'water'
  }

  if (!ship) {
    return 'miss'
  }

  return isShipSunk(ship, board.shots) ? 'sunk' : 'hit'
}

export function countSunkShips(board: BoardState): number {
  return board.ships.filter((ship) => isShipSunk(ship, board.shots)).length
}

export function positionAlreadyListed(positions: Position[], candidate: Position): boolean {
  return positions.some((position) => isSamePosition(position, candidate))
}
