import {
  positionAlreadyListed,
  type Position,
  type ShotResult,
} from './gameLogic'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type AiMemory = {
  targetQueue: Position[]
  unresolvedHits: Position[]
}

function toKey(position: Position): string {
  return `${position[0]},${position[1]}`
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function isKnownShot(firedShots: Position[], target: Position): boolean {
  return positionAlreadyListed(firedShots, target)
}

function getNeighbors(position: Position, boardSize: number): Position[] {
  const [row, col] = position
  const candidates: Position[] = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ]

  return candidates.filter(
    ([nextRow, nextCol]) =>
      nextRow >= 0 && nextRow < boardSize && nextCol >= 0 && nextCol < boardSize,
  )
}

function getAvailableShots(firedShots: Position[], boardSize: number): Position[] {
  const fired = new Set<string>(firedShots.map(toKey))
  const available: Position[] = []

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const key = `${row},${col}`
      if (!fired.has(key)) {
        available.push([row, col])
      }
    }
  }

  return available
}

function pickHardTarget(
  memory: AiMemory,
  firedShots: Position[],
  boardSize: number,
  availableShots: Position[],
): Position {
  const unresolvedHits = memory.unresolvedHits

  if (unresolvedHits.length >= 2) {
    const sortedByRow = [...unresolvedHits].sort((a, b) => a[0] - b[0])
    const sortedByCol = [...unresolvedHits].sort((a, b) => a[1] - b[1])
    const sameRow = unresolvedHits.every((position) => position[0] === unresolvedHits[0][0])
    const sameCol = unresolvedHits.every((position) => position[1] === unresolvedHits[0][1])

    if (sameRow) {
      const row = unresolvedHits[0][0]
      const left: Position = [row, sortedByCol[0][1] - 1]
      const right: Position = [row, sortedByCol[sortedByCol.length - 1][1] + 1]
      const candidates = [left, right].filter(
        ([candidateRow, candidateCol]) =>
          candidateRow >= 0 &&
          candidateRow < boardSize &&
          candidateCol >= 0 &&
          candidateCol < boardSize &&
          !isKnownShot(firedShots, [candidateRow, candidateCol]),
      )

      if (candidates.length > 0) {
        return randomItem(candidates)
      }
    }

    if (sameCol) {
      const col = unresolvedHits[0][1]
      const up: Position = [sortedByRow[0][0] - 1, col]
      const down: Position = [sortedByRow[sortedByRow.length - 1][0] + 1, col]
      const candidates = [up, down].filter(
        ([candidateRow, candidateCol]) =>
          candidateRow >= 0 &&
          candidateRow < boardSize &&
          candidateCol >= 0 &&
          candidateCol < boardSize &&
          !isKnownShot(firedShots, [candidateRow, candidateCol]),
      )

      if (candidates.length > 0) {
        return randomItem(candidates)
      }
    }
  }

  const queueTargets = memory.targetQueue.filter((target) => !isKnownShot(firedShots, target))
  if (queueTargets.length > 0) {
    return queueTargets[0]
  }

  const checkerboardShots = availableShots.filter(([row, col]) => (row + col) % 2 === 0)
  if (checkerboardShots.length > 0) {
    return randomItem(checkerboardShots)
  }

  return randomItem(availableShots)
}

export function createInitialAiMemory(): AiMemory {
  return {
    targetQueue: [],
    unresolvedHits: [],
  }
}

export function recordAiShotResult(
  memory: AiMemory,
  shot: Position,
  result: ShotResult,
  boardSize: number,
  firedShots: Position[],
): AiMemory {
  let targetQueue = memory.targetQueue.filter((queued) => !isKnownShot(firedShots, queued))
  let unresolvedHits = [...memory.unresolvedHits]

  if (result === 'hit') {
    if (!positionAlreadyListed(unresolvedHits, shot)) {
      unresolvedHits = [...unresolvedHits, shot]
    }

    const neighbors = getNeighbors(shot, boardSize)
    for (const neighbor of neighbors) {
      if (isKnownShot(firedShots, neighbor)) {
        continue
      }
      if (positionAlreadyListed(targetQueue, neighbor)) {
        continue
      }
      targetQueue.push(neighbor)
    }
  }

  if (result === 'sunk') {
    unresolvedHits = []
    targetQueue = []
  }

  return {
    targetQueue,
    unresolvedHits,
  }
}

export function getNextAiShot(
  difficulty: Difficulty,
  memory: AiMemory,
  firedShots: Position[],
  boardSize: number,
): Position {
  const availableShots = getAvailableShots(firedShots, boardSize)

  if (availableShots.length === 0) {
    throw new Error('No available AI shots left')
  }

  if (difficulty === 'easy') {
    return randomItem(availableShots)
  }

  if (difficulty === 'medium') {
    const queueTargets = memory.targetQueue.filter((target) => !isKnownShot(firedShots, target))
    if (queueTargets.length > 0) {
      return queueTargets[0]
    }
    return randomItem(availableShots)
  }

  return pickHardTarget(memory, firedShots, boardSize, availableShots)
}
