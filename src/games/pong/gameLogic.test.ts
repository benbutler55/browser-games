import { describe, it, expect } from 'vitest'
import {
  createServeSnapshot,
  advanceSnapshot,
  difficultyConfig,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PADDLE_HEIGHT,
  BALL_SIZE,
  type InputState,
} from './gameLogic'

const noInput: InputState = {
  playerUp: false,
  playerDown: false,
  opponentUp: false,
  opponentDown: false,
}

describe('createServeSnapshot', () => {
  const config = difficultyConfig.casual

  it('centers the ball horizontally and vertically', () => {
    const snapshot = createServeSnapshot(config, 'right')
    expect(snapshot.ballX).toBe((BOARD_WIDTH - BALL_SIZE) / 2)
    expect(snapshot.ballY).toBe((BOARD_HEIGHT - BALL_SIZE) / 2)
  })

  it('centers both paddles vertically', () => {
    const snapshot = createServeSnapshot(config, 'right')
    const expectedY = (BOARD_HEIGHT - PADDLE_HEIGHT) / 2
    expect(snapshot.playerY).toBe(expectedY)
    expect(snapshot.aiY).toBe(expectedY)
  })

  it('sets ball velocity rightward when direction is right', () => {
    const snapshot = createServeSnapshot(config, 'right')
    expect(snapshot.velocityX).toBe(config.ballSpeed)
  })

  it('sets ball velocity leftward when direction is left', () => {
    const snapshot = createServeSnapshot(config, 'left')
    expect(snapshot.velocityX).toBe(-config.ballSpeed)
  })

  it('gives the ball some vertical velocity', () => {
    // The vertical seed is random, but should be in range [-12, 12]
    const snapshot = createServeSnapshot(config, 'right')
    expect(snapshot.velocityY).toBeGreaterThanOrEqual(-12)
    expect(snapshot.velocityY).toBeLessThanOrEqual(12)
  })
})

describe('advanceSnapshot', () => {
  const config = difficultyConfig.casual

  it('moves the ball based on velocity and deltaSeconds', () => {
    const snapshot = createServeSnapshot(config, 'right')
    // Override velocityY for predictability
    const fixedSnapshot = { ...snapshot, velocityY: 0 }
    const { snapshot: next } = advanceSnapshot(fixedSnapshot, 0.1, config, noInput, 'computer')
    expect(next.ballX).toBeCloseTo(fixedSnapshot.ballX + fixedSnapshot.velocityX * 0.1, 5)
    expect(next.ballY).toBeCloseTo(fixedSnapshot.ballY, 5)
  })

  it('returns scorer as null when ball is in play', () => {
    const snapshot = createServeSnapshot(config, 'right')
    const fixedSnapshot = { ...snapshot, velocityY: 0 }
    const { scorer } = advanceSnapshot(fixedSnapshot, 0.01, config, noInput, 'computer')
    expect(scorer).toBeNull()
  })

  it('moves player paddle down on playerDown input', () => {
    const snapshot = createServeSnapshot(config, 'right')
    const input: InputState = { ...noInput, playerDown: true }
    const { snapshot: next } = advanceSnapshot(snapshot, 0.1, config, input, 'computer')
    expect(next.playerY).toBeGreaterThan(snapshot.playerY)
  })

  it('moves player paddle up on playerUp input', () => {
    const snapshot = createServeSnapshot(config, 'right')
    // Start paddle in the middle so it can move up
    const input: InputState = { ...noInput, playerUp: true }
    const { snapshot: next } = advanceSnapshot(snapshot, 0.1, config, input, 'computer')
    expect(next.playerY).toBeLessThan(snapshot.playerY)
  })

  it('clamps player paddle within board bounds', () => {
    const snapshot = { ...createServeSnapshot(config, 'right'), playerY: 0 }
    const input: InputState = { ...noInput, playerUp: true }
    const { snapshot: next } = advanceSnapshot(snapshot, 1.0, config, input, 'computer')
    expect(next.playerY).toBeGreaterThanOrEqual(0)
  })

  it('moves opponent paddle with keyboard in local mode', () => {
    const snapshot = createServeSnapshot(config, 'right')
    const input: InputState = { ...noInput, opponentDown: true }
    const { snapshot: next } = advanceSnapshot(snapshot, 0.1, config, input, 'local')
    expect(next.aiY).toBeGreaterThan(snapshot.aiY)
  })

  it('scores for ai when ball exits left', () => {
    const snapshot = {
      ...createServeSnapshot(config, 'left'),
      ballX: 0,
      velocityX: -200,
      velocityY: 0,
    }
    const { scorer } = advanceSnapshot(snapshot, 0.1, config, noInput, 'computer')
    expect(scorer).toBe('ai')
  })

  it('scores for player when ball exits right', () => {
    const snapshot = {
      ...createServeSnapshot(config, 'right'),
      ballX: BOARD_WIDTH - 1,
      velocityX: 200,
      velocityY: 0,
    }
    const { scorer } = advanceSnapshot(snapshot, 0.1, config, noInput, 'computer')
    expect(scorer).toBe('player')
  })

  it('bounces ball off top wall', () => {
    const snapshot = {
      ...createServeSnapshot(config, 'right'),
      ballY: 1,
      velocityY: -50,
    }
    const { snapshot: next } = advanceSnapshot(snapshot, 0.1, config, noInput, 'computer')
    expect(next.ballY).toBeGreaterThanOrEqual(0)
    expect(next.velocityY).toBeGreaterThan(0)
  })

  it('bounces ball off bottom wall', () => {
    const snapshot = {
      ...createServeSnapshot(config, 'right'),
      ballY: BOARD_HEIGHT - BALL_SIZE - 1,
      velocityY: 50,
    }
    const { snapshot: next } = advanceSnapshot(snapshot, 0.1, config, noInput, 'computer')
    expect(next.ballY).toBeLessThanOrEqual(BOARD_HEIGHT - BALL_SIZE)
    expect(next.velocityY).toBeLessThan(0)
  })
})
