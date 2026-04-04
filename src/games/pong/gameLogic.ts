export type PongDifficulty = 'casual' | 'arcade' | 'expert'
export type PaddleSide = 'player' | 'ai'
export type ControlMode = 'computer' | 'local'

export type PongSnapshot = {
  playerY: number
  aiY: number
  ballX: number
  ballY: number
  velocityX: number
  velocityY: number
}

export type InputState = {
  playerUp: boolean
  playerDown: boolean
  opponentUp: boolean
  opponentDown: boolean
}

export type DifficultyConfig = {
  paddleSpeed: number
  aiSpeed: number
  ballSpeed: number
  maxBallSpeed: number
  spinForce: number
  aiBias: number
}

export const BOARD_WIDTH = 100
export const BOARD_HEIGHT = 100
export const PADDLE_HEIGHT = 22
export const PADDLE_WIDTH = 2.8
export const BALL_SIZE = 3.2
export const PLAYER_X = 4
export const AI_X = BOARD_WIDTH - PADDLE_WIDTH - 4
export const TARGET_SCORE = 5

export const difficultyConfig: Record<PongDifficulty, DifficultyConfig> = {
  casual: {
    paddleSpeed: 82,
    aiSpeed: 58,
    ballSpeed: 42,
    maxBallSpeed: 76,
    spinForce: 22,
    aiBias: 2.6,
  },
  arcade: {
    paddleSpeed: 88,
    aiSpeed: 66,
    ballSpeed: 48,
    maxBallSpeed: 84,
    spinForce: 26,
    aiBias: 1.8,
  },
  expert: {
    paddleSpeed: 94,
    aiSpeed: 74,
    ballSpeed: 54,
    maxBallSpeed: 92,
    spinForce: 30,
    aiBias: 1.2,
  },
}

export function createServeSnapshot(
  config: DifficultyConfig,
  direction: 'left' | 'right',
): PongSnapshot {
  const verticalSeed = Math.random() * 24 - 12

  return {
    playerY: (BOARD_HEIGHT - PADDLE_HEIGHT) / 2,
    aiY: (BOARD_HEIGHT - PADDLE_HEIGHT) / 2,
    ballX: (BOARD_WIDTH - BALL_SIZE) / 2,
    ballY: (BOARD_HEIGHT - BALL_SIZE) / 2,
    velocityX: direction === 'right' ? config.ballSpeed : -config.ballSpeed,
    velocityY: verticalSeed,
  }
}

export function advanceSnapshot(
  snapshot: PongSnapshot,
  deltaSeconds: number,
  config: DifficultyConfig,
  input: InputState,
  controlMode: ControlMode,
) {
  const playerDirection = Number(input.playerDown) - Number(input.playerUp)
  const playerY = clamp(
    snapshot.playerY + playerDirection * config.paddleSpeed * deltaSeconds,
    0,
    BOARD_HEIGHT - PADDLE_HEIGHT,
  )

  const aiY =
    controlMode === 'local'
      ? clamp(
          snapshot.aiY +
            (Number(input.opponentDown) - Number(input.opponentUp)) * config.paddleSpeed * deltaSeconds,
          0,
          BOARD_HEIGHT - PADDLE_HEIGHT,
        )
      : moveAi(snapshot, deltaSeconds, config)

  let nextSnapshot: PongSnapshot = {
    ...snapshot,
    playerY,
    aiY,
    ballX: snapshot.ballX + snapshot.velocityX * deltaSeconds,
    ballY: snapshot.ballY + snapshot.velocityY * deltaSeconds,
  }

  if (nextSnapshot.ballY <= 0) {
    nextSnapshot = {
      ...nextSnapshot,
      ballY: 0,
      velocityY: Math.abs(nextSnapshot.velocityY),
    }
  }

  if (nextSnapshot.ballY + BALL_SIZE >= BOARD_HEIGHT) {
    nextSnapshot = {
      ...nextSnapshot,
      ballY: BOARD_HEIGHT - BALL_SIZE,
      velocityY: -Math.abs(nextSnapshot.velocityY),
    }
  }

  if (shouldBounce(nextSnapshot, playerY, PLAYER_X) && nextSnapshot.velocityX < 0) {
    nextSnapshot = reflectBall(nextSnapshot, playerY, PLAYER_X + PADDLE_WIDTH, config, 'right')
  }

  if (shouldBounce(nextSnapshot, aiY, AI_X) && nextSnapshot.velocityX > 0) {
    nextSnapshot = reflectBall(nextSnapshot, aiY, AI_X - BALL_SIZE, config, 'left')
  }

  if (nextSnapshot.ballX + BALL_SIZE < 0) {
    return { snapshot: nextSnapshot, scorer: 'ai' as const }
  }

  if (nextSnapshot.ballX > BOARD_WIDTH) {
    return { snapshot: nextSnapshot, scorer: 'player' as const }
  }

  return { snapshot: nextSnapshot, scorer: null }
}

function moveAi(snapshot: PongSnapshot, deltaSeconds: number, config: DifficultyConfig) {
  const aiCenter = snapshot.aiY + PADDLE_HEIGHT / 2
  const ballCenter =
    snapshot.ballY + BALL_SIZE / 2 + snapshot.velocityY * config.aiBias * deltaSeconds
  const aiStep = clamp(
    ballCenter - aiCenter,
    -config.aiSpeed * deltaSeconds,
    config.aiSpeed * deltaSeconds,
  )

  return clamp(snapshot.aiY + aiStep, 0, BOARD_HEIGHT - PADDLE_HEIGHT)
}

function shouldBounce(snapshot: PongSnapshot, paddleY: number, paddleX: number) {
  const overlapsX =
    snapshot.ballX <= paddleX + PADDLE_WIDTH && snapshot.ballX + BALL_SIZE >= paddleX
  const overlapsY =
    snapshot.ballY <= paddleY + PADDLE_HEIGHT && snapshot.ballY + BALL_SIZE >= paddleY

  return overlapsX && overlapsY
}

function reflectBall(
  snapshot: PongSnapshot,
  paddleY: number,
  nextBallX: number,
  config: DifficultyConfig,
  direction: 'left' | 'right',
) {
  const paddleCenter = paddleY + PADDLE_HEIGHT / 2
  const ballCenter = snapshot.ballY + BALL_SIZE / 2
  const impact = (ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2)
  const speed = Math.min(
    Math.hypot(snapshot.velocityX, snapshot.velocityY) * 1.04,
    config.maxBallSpeed,
  )
  const velocityY = clamp(snapshot.velocityY + impact * config.spinForce, -52, 52)
  const velocityXMagnitude = Math.max(Math.sqrt(Math.max(speed ** 2 - velocityY ** 2, 0)), speed * 0.52)
  const velocityX = direction === 'right' ? velocityXMagnitude : -velocityXMagnitude

  return {
    ...snapshot,
    ballX: nextBallX,
    velocityX,
    velocityY,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
