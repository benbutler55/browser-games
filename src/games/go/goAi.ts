import {
  GoState,
  GoBoard,
  Position,
  StoneColor,
  placeStone,
  pass,
  calculateScore,
  opponentColor,
  cloneBoard,
} from './gameLogic'

export type Difficulty = 'easy' | 'medium' | 'hard'

const SIMULATION_COUNTS: Record<Difficulty, number> = {
  easy: 200,
  medium: 800,
  hard: 2000,
}

const BOARD_SIZE = 9
const EXPLORATION_CONSTANT = 1.41
const MAX_ROLLOUT_MOVES = 81
const PASS_PROBABILITY = 0.1

type Move = Position | 'pass'

interface MCTSNode {
  state: GoState
  move: Move | null
  parent: MCTSNode | null
  children: MCTSNode[]
  wins: number
  visits: number
  untriedMoves: Move[]
}

function getLegalMoves(state: GoState): Move[] {
  const moves: Move[] = []

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (state.board[r][c] === null) {
        const result = placeStone(state, [r, c])
        if (result !== null) {
          moves.push([r, c])
        }
      }
    }
  }

  moves.push('pass')
  return moves
}

function createNode(
  state: GoState,
  move: Move | null,
  parent: MCTSNode | null
): MCTSNode {
  const untriedMoves = state.gameOver ? [] : getLegalMoves(state)
  return {
    state,
    move,
    parent,
    children: [],
    wins: 0,
    visits: 0,
    untriedMoves,
  }
}

function ucb1(node: MCTSNode, parentVisits: number): number {
  if (node.visits === 0) return Infinity
  return (
    node.wins / node.visits +
    EXPLORATION_CONSTANT * Math.sqrt(Math.log(parentVisits) / node.visits)
  )
}

function selectChild(node: MCTSNode): MCTSNode {
  let bestChild = node.children[0]
  let bestUcb = -Infinity

  for (const child of node.children) {
    const childUcb = ucb1(child, node.visits)
    if (childUcb > bestUcb) {
      bestUcb = childUcb
      bestChild = child
    }
  }

  return bestChild
}

function applyMove(state: GoState, move: Move): GoState {
  if (move === 'pass') {
    return pass(state)
  }
  const result = placeStone(state, move)
  // Should not happen if move was legal, but fall back to pass
  if (result === null) {
    return pass(state)
  }
  return result
}

/**
 * Selection phase: traverse the tree using UCB1 until we find a node
 * that has untried moves or is terminal.
 */
function select(node: MCTSNode): MCTSNode {
  let current = node
  while (
    current.untriedMoves.length === 0 &&
    current.children.length > 0 &&
    !current.state.gameOver
  ) {
    current = selectChild(current)
  }
  return current
}

/**
 * Expansion phase: add a child node for a random untried move.
 */
function expand(node: MCTSNode): MCTSNode {
  if (node.untriedMoves.length === 0 || node.state.gameOver) {
    return node
  }

  const moveIndex = Math.floor(Math.random() * node.untriedMoves.length)
  const move = node.untriedMoves[moveIndex]
  node.untriedMoves.splice(moveIndex, 1)

  const newState = applyMove(node.state, move)
  const child = createNode(newState, move, node)
  node.children.push(child)

  return child
}

/**
 * Simulation (rollout) phase: play random legal moves until the game ends.
 * Includes a small chance of passing to prevent infinite games.
 * Capped at MAX_ROLLOUT_MOVES.
 */
function simulate(state: GoState): StoneColor {
  let current: GoState = {
    board: cloneBoard(state.board),
    turn: state.turn,
    captures: { ...state.captures },
    previousBoard: state.previousBoard ? cloneBoard(state.previousBoard) : null,
    consecutivePasses: state.consecutivePasses,
    gameOver: state.gameOver,
    moveHistory: [...state.moveHistory],
  }

  let movesPlayed = 0

  while (!current.gameOver && movesPlayed < MAX_ROLLOUT_MOVES) {
    // Random chance to pass
    if (Math.random() < PASS_PROBABILITY) {
      current = pass(current)
      movesPlayed++
      continue
    }

    // Collect legal placement moves
    const legalMoves: Position[] = []
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (current.board[r][c] === null) {
          const result = placeStone(current, [r, c])
          if (result !== null) {
            legalMoves.push([r, c])
          }
        }
      }
    }

    if (legalMoves.length === 0) {
      // No legal placements, must pass
      current = pass(current)
    } else {
      const randomMove =
        legalMoves[Math.floor(Math.random() * legalMoves.length)]
      const result = placeStone(current, randomMove)
      if (result !== null) {
        current = result
      } else {
        current = pass(current)
      }
    }

    movesPlayed++
  }

  // Determine winner by score
  const score = calculateScore(current.board)
  return score.black > score.white ? 'black' : 'white'
}

/**
 * Backpropagation phase: update win/loss stats up the tree,
 * flipping the result at each level.
 */
function backpropagate(node: MCTSNode | null, winner: StoneColor): void {
  let current = node
  while (current !== null) {
    current.visits++
    // The node's parent made the move that led to this state.
    // If the winner is the opponent of the player whose turn it is at this node,
    // that means the parent's move was good, so we increment wins.
    // Equivalently: the node records a win if the winner is NOT the player
    // who is about to move at this node (because the previous player placed us here).
    if (winner !== current.state.turn) {
      current.wins++
    }
    current = current.parent
  }
}

/**
 * Run MCTS and return the best move for the current player.
 */
export function getBestMove(
  state: GoState,
  difficulty: Difficulty
): Move {
  if (state.gameOver) {
    return 'pass'
  }

  const simulations = SIMULATION_COUNTS[difficulty]
  const root = createNode(state, null, null)

  for (let i = 0; i < simulations; i++) {
    // 1. Selection
    let node = select(root)

    // 2. Expansion
    if (!node.state.gameOver && node.untriedMoves.length > 0) {
      node = expand(node)
    }

    // 3. Simulation (rollout)
    const winner = simulate(node.state)

    // 4. Backpropagation
    backpropagate(node, winner)
  }

  // Return the child with the most visits (most robust selection)
  if (root.children.length === 0) {
    return 'pass'
  }

  let bestChild = root.children[0]
  for (const child of root.children) {
    if (child.visits > bestChild.visits) {
      bestChild = child
    }
  }

  return bestChild.move!
}
