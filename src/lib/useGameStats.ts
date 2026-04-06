import { useLocalStorage } from './useLocalStorage'

type GameStats = {
  wins: number
  losses: number
  bestTime: number | null
}

const defaultStats: GameStats = {
  wins: 0,
  losses: 0,
  bestTime: null,
}

export function useGameStats(gameSlug: string) {
  const [stats, setStats] = useLocalStorage<GameStats>(`${gameSlug}-stats`, defaultStats)

  function recordWin(timeSeconds?: number) {
    setStats((prev) => ({
      ...prev,
      wins: prev.wins + 1,
      bestTime:
        timeSeconds !== undefined
          ? prev.bestTime === null
            ? timeSeconds
            : Math.min(prev.bestTime, timeSeconds)
          : prev.bestTime,
    }))
  }

  function recordLoss() {
    setStats((prev) => ({
      ...prev,
      losses: prev.losses + 1,
    }))
  }

  function resetStats() {
    setStats(defaultStats)
  }

  return { stats, recordWin, recordLoss, resetStats }
}
