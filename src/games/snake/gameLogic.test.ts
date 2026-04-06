import { describe, it, expect } from 'vitest'
import { createInitialState, changeDirection, advanceState } from './gameLogic'

describe('createInitialState', () => {
  it('creates snake at center with 3 segments', () => {
    const state = createInitialState(20, 20)
    expect(state.snake).toHaveLength(3)
    expect(state.snake[0]).toEqual({ x: 10, y: 10 })
    expect(state.snake[1]).toEqual({ x: 9, y: 10 })
    expect(state.snake[2]).toEqual({ x: 8, y: 10 })
  })

  it('starts heading right', () => {
    const state = createInitialState(20, 20)
    expect(state.direction).toBe('right')
  })

  it('places food on the grid', () => {
    const state = createInitialState(20, 20)
    expect(state.food.x).toBeGreaterThanOrEqual(0)
    expect(state.food.x).toBeLessThan(20)
    expect(state.food.y).toBeGreaterThanOrEqual(0)
    expect(state.food.y).toBeLessThan(20)
  })

  it('food is not on the snake', () => {
    const state = createInitialState(20, 20)
    const onSnake = state.snake.some(
      (p) => p.x === state.food.x && p.y === state.food.y,
    )
    expect(onSnake).toBe(false)
  })

  it('starts with score 0 and not game over', () => {
    const state = createInitialState(20, 20)
    expect(state.score).toBe(0)
    expect(state.gameOver).toBe(false)
  })
})

describe('changeDirection', () => {
  it('allows perpendicular direction change', () => {
    const state = createInitialState(20, 20)
    const updated = changeDirection(state, 'up')
    expect(updated.direction).toBe('up')
  })

  it('allows perpendicular direction change to down', () => {
    const state = createInitialState(20, 20)
    const updated = changeDirection(state, 'down')
    expect(updated.direction).toBe('down')
  })

  it('blocks 180-degree turn (right to left)', () => {
    const state = createInitialState(20, 20)
    const updated = changeDirection(state, 'left')
    expect(updated.direction).toBe('right')
  })

  it('blocks 180-degree turn (up to down)', () => {
    let state = createInitialState(20, 20)
    state = changeDirection(state, 'up')
    const updated = changeDirection(state, 'down')
    expect(updated.direction).toBe('up')
  })
})

describe('advanceState', () => {
  it('moves the snake forward', () => {
    const state = createInitialState(20, 20)
    const next = advanceState(state)
    expect(next.snake[0]).toEqual({ x: 11, y: 10 })
    expect(next.snake).toHaveLength(3)
  })

  it('tail follows the head', () => {
    const state = createInitialState(20, 20)
    const next = advanceState(state)
    expect(next.snake[1]).toEqual({ x: 10, y: 10 })
    expect(next.snake[2]).toEqual({ x: 9, y: 10 })
  })

  it('triggers game over on wall collision', () => {
    let state = createInitialState(20, 20)
    // Move right until hitting the wall
    for (let i = 0; i < 20; i++) {
      state = advanceState(state)
      if (state.gameOver) break
    }
    expect(state.gameOver).toBe(true)
  })

  it('triggers game over on self collision', () => {
    // Build a snake that will collide with itself
    const state = createInitialState(20, 20)
    // Make a long snake going right, then turn into itself
    const longSnake = Array.from({ length: 5 }, (_, i) => ({
      x: 10 - i,
      y: 10,
    }))
    const withLongSnake = { ...state, snake: longSnake, direction: 'down' as const }
    const afterDown = advanceState(withLongSnake)
    const turnLeft = changeDirection(afterDown, 'left')
    const afterLeft = advanceState(turnLeft)
    const turnUp = changeDirection(afterLeft, 'up')
    const afterUp = advanceState(turnUp)
    expect(afterUp.gameOver).toBe(true)
  })

  it('grows the snake when eating food', () => {
    const state = createInitialState(20, 20)
    // Place food directly ahead
    const withFood = { ...state, food: { x: 11, y: 10 } }
    const next = advanceState(withFood)
    expect(next.snake).toHaveLength(4)
    expect(next.score).toBe(1)
  })

  it('places new food after eating', () => {
    const state = createInitialState(20, 20)
    const withFood = { ...state, food: { x: 11, y: 10 } }
    const next = advanceState(withFood)
    // New food should not be on the snake
    const onSnake = next.snake.some(
      (p) => p.x === next.food.x && p.y === next.food.y,
    )
    expect(onSnake).toBe(false)
  })

  it('does nothing when game is already over', () => {
    const state = createInitialState(20, 20)
    const over = { ...state, gameOver: true }
    const next = advanceState(over)
    expect(next).toEqual(over)
  })
})
