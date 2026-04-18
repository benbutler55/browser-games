import { describe, expect, it } from 'vitest'
import {
  BOARD_SIZE,
  DEFAULT_FLEET,
  canPlaceShip,
  countSunkShips,
  createBoardState,
  createRandomFleet,
  fireShot,
  getShipAtPosition,
  getShipCells,
  getVisibleCellState,
  hasShotAt,
  isFleetPlaced,
  isShipSunk,
  type Ship,
} from './gameLogic'

describe('ship placement', () => {
  it('allows in-bounds horizontal placement', () => {
    const ship: Ship = { id: 0, length: 5, row: 0, col: 0, orientation: 'horizontal' }
    expect(canPlaceShip([], ship, BOARD_SIZE)).toBe(true)
  })

  it('rejects out-of-bounds horizontal placement', () => {
    const ship: Ship = { id: 0, length: 5, row: 0, col: 7, orientation: 'horizontal' }
    expect(canPlaceShip([], ship, BOARD_SIZE)).toBe(false)
  })

  it('rejects overlap placements', () => {
    const existing: Ship = { id: 0, length: 4, row: 2, col: 2, orientation: 'horizontal' }
    const overlap: Ship = { id: 1, length: 3, row: 2, col: 3, orientation: 'vertical' }
    expect(canPlaceShip([existing], overlap, BOARD_SIZE)).toBe(false)
  })

  it('considers a fleet complete only when all required ships exist', () => {
    const partialFleet: Ship[] = [
      { id: 0, length: 5, row: 0, col: 0, orientation: 'horizontal' },
      { id: 1, length: 4, row: 1, col: 0, orientation: 'horizontal' },
    ]

    expect(isFleetPlaced(partialFleet, DEFAULT_FLEET)).toBe(false)
  })
})

describe('random fleet generator', () => {
  it('creates a full valid non-overlapping fleet repeatedly', () => {
    for (let run = 0; run < 120; run++) {
      const fleet = createRandomFleet(DEFAULT_FLEET, BOARD_SIZE)
      expect(isFleetPlaced(fleet, DEFAULT_FLEET)).toBe(true)

      const occupied = new Set<string>()
      for (const ship of fleet) {
        for (const [row, col] of getShipCells(ship)) {
          const key = `${row},${col}`
          expect(occupied.has(key)).toBe(false)
          occupied.add(key)
        }
      }
    }
  })
})

describe('battle resolution', () => {
  it('marks misses and disallows repeat shots', () => {
    const board = createBoardState(BOARD_SIZE)
    const first = fireShot(board, [4, 4])
    expect(first.result).toBe('miss')
    expect(hasShotAt(first.board.shots, 4, 4)).toBe(true)

    const repeat = fireShot(first.board, [4, 4])
    expect(repeat.result).toBe('repeat')
  })

  it('marks a ship as sunk on its final segment', () => {
    const ship: Ship = { id: 0, length: 2, row: 0, col: 0, orientation: 'horizontal' }
    const board = {
      ...createBoardState(BOARD_SIZE),
      ships: [ship],
    }

    const first = fireShot(board, [0, 0])
    expect(first.result).toBe('hit')

    const second = fireShot(first.board, [0, 1])
    expect(second.result).toBe('sunk')
    expect(isShipSunk(ship, second.board.shots)).toBe(true)
  })

  it('ends the game when the final ship is sunk', () => {
    const shipA: Ship = { id: 0, length: 2, row: 0, col: 0, orientation: 'horizontal' }
    const shipB: Ship = { id: 1, length: 1, row: 5, col: 5, orientation: 'vertical' }
    const board = {
      ...createBoardState(BOARD_SIZE),
      ships: [shipA, shipB],
    }

    const a1 = fireShot(board, [0, 0])
    const a2 = fireShot(a1.board, [0, 1])
    expect(a2.gameOver).toBe(false)
    expect(countSunkShips(a2.board)).toBe(1)

    const b1 = fireShot(a2.board, [5, 5])
    expect(b1.result).toBe('sunk')
    expect(b1.gameOver).toBe(true)
    expect(countSunkShips(b1.board)).toBe(2)
  })
})

describe('board rendering helpers', () => {
  it('returns expected visible state for hidden and revealed boards', () => {
    const ship: Ship = { id: 0, length: 3, row: 1, col: 1, orientation: 'horizontal' }
    const board = {
      ...createBoardState(BOARD_SIZE),
      ships: [ship],
    }

    expect(getVisibleCellState(board, 1, 1, false)).toBe('water')
    expect(getVisibleCellState(board, 1, 1, true)).toBe('ship')

    const hitBoard = fireShot(board, [1, 1]).board
    expect(getVisibleCellState(hitBoard, 1, 1, true)).toBe('hit')

    const sunkBoard = fireShot(fireShot(hitBoard, [1, 2]).board, [1, 3]).board
    expect(getVisibleCellState(sunkBoard, 1, 1, true)).toBe('sunk')
    expect(getShipAtPosition(sunkBoard.ships, 1, 2)?.id).toBe(0)
  })
})
