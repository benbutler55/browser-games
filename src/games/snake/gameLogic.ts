export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export type SnakeState = {
  snake: Point[]
  food: Point
  direction: Direction
  gridWidth: number
  gridHeight: number
  score: number
  gameOver: boolean
}

function randomFood(gridWidth: number, gridHeight: number, snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`))
  const free: Point[] = []
  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      if (!occupied.has(`${x},${y}`)) {
        free.push({ x, y })
      }
    }
  }
  if (free.length === 0) return { x: 0, y: 0 }
  return free[Math.floor(Math.random() * free.length)]
}

export function createInitialState(gridWidth: number, gridHeight: number): SnakeState {
  const centerX = Math.floor(gridWidth / 2)
  const centerY = Math.floor(gridHeight / 2)
  const snake: Point[] = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ]
  const food = randomFood(gridWidth, gridHeight, snake)
  return {
    snake,
    food,
    direction: 'right',
    gridWidth,
    gridHeight,
    score: 0,
    gameOver: false,
  }
}

const opposites: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

export function changeDirection(state: SnakeState, direction: Direction): SnakeState {
  if (opposites[state.direction] === direction) return state
  return { ...state, direction }
}

export function advanceState(state: SnakeState): SnakeState {
  if (state.gameOver) return state

  const head = state.snake[0]
  const delta: Record<Direction, Point> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  }
  const d = delta[state.direction]
  const newHead: Point = { x: head.x + d.x, y: head.y + d.y }

  // Wall collision
  if (
    newHead.x < 0 ||
    newHead.x >= state.gridWidth ||
    newHead.y < 0 ||
    newHead.y >= state.gridHeight
  ) {
    return { ...state, gameOver: true }
  }

  // Self collision (check against all segments except the tail, which will move)
  const willEat = newHead.x === state.food.x && newHead.y === state.food.y
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1)
  if (bodyToCheck.some((p) => p.x === newHead.x && p.y === newHead.y)) {
    return { ...state, gameOver: true }
  }

  if (willEat) {
    const newSnake = [newHead, ...state.snake]
    const newFood = randomFood(state.gridWidth, state.gridHeight, newSnake)
    return {
      ...state,
      snake: newSnake,
      food: newFood,
      score: state.score + 1,
    }
  }

  const newSnake = [newHead, ...state.snake.slice(0, -1)]
  return { ...state, snake: newSnake }
}
