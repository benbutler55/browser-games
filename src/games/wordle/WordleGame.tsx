import { useCallback, useEffect, useState } from 'react'
import { evaluateGuess, getWordForDate, isValidWord } from './gameLogic'
import type { LetterResult } from './gameLogic'
import { answers, dictionary } from './words'

const ROWS = 6
const COLS = 5

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
]

type GameState = {
  guesses: string[]
  results: LetterResult[][]
  current: string
  status: 'playing' | 'won' | 'lost'
  answer: string
}

type Stats = {
  played: number
  won: number
}

function getTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadState(answer: string): GameState {
  const key = `wordle-${getTodayKey()}`
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const saved = JSON.parse(raw) as GameState
      if (saved.answer === answer) return saved
    }
  } catch {
    // ignore
  }
  return { guesses: [], results: [], current: '', status: 'playing', answer }
}

function saveState(state: GameState) {
  const key = `wordle-${getTodayKey()}`
  localStorage.setItem(key, JSON.stringify(state))
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem('wordle-stats')
    if (raw) return JSON.parse(raw) as Stats
  } catch {
    // ignore
  }
  return { played: 0, won: 0 }
}

function saveStats(stats: Stats) {
  localStorage.setItem('wordle-stats', JSON.stringify(stats))
}

export function WordleGame() {
  const [answer] = useState(() => getWordForDate(answers, new Date()))
  const [state, setState] = useState<GameState>(() => loadState(answer))
  const [stats, setStats] = useState<Stats>(loadStats)
  const [message, setMessage] = useState('')
  const [shakeRow, setShakeRow] = useState(-1)

  const showMessage = useCallback((msg: string, duration = 1500) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), duration)
  }, [])

  const letterStates = (() => {
    const map: Record<string, LetterResult> = {}
    for (let g = 0; g < state.guesses.length; g++) {
      const word = state.guesses[g]
      const result = state.results[g]
      for (let i = 0; i < COLS; i++) {
        const letter = word[i].toUpperCase()
        const current = map[letter]
        const next = result[i]
        if (next === 'correct') {
          map[letter] = 'correct'
        } else if (next === 'present' && current !== 'correct') {
          map[letter] = 'present'
        } else if (!current) {
          map[letter] = 'absent'
        }
      }
    }
    return map
  })()

  const submitGuess = useCallback(() => {
    if (state.status !== 'playing') return
    if (state.current.length !== COLS) {
      showMessage('Not enough letters')
      setShakeRow(state.guesses.length)
      setTimeout(() => setShakeRow(-1), 400)
      return
    }
    if (!isValidWord(state.current, dictionary)) {
      showMessage('Not in word list')
      setShakeRow(state.guesses.length)
      setTimeout(() => setShakeRow(-1), 400)
      return
    }

    const result = evaluateGuess(state.current.toLowerCase(), answer)
    const guesses = [...state.guesses, state.current.toLowerCase()]
    const results = [...state.results, result]

    let status: GameState['status'] = 'playing'
    const newStats = { ...stats }

    if (result.every((r) => r === 'correct')) {
      status = 'won'
      newStats.played += 1
      newStats.won += 1
      showMessage('Well done!', 3000)
    } else if (guesses.length >= ROWS) {
      status = 'lost'
      newStats.played += 1
      showMessage(answer.toUpperCase(), 5000)
    }

    if (status !== 'playing') {
      setStats(newStats)
      saveStats(newStats)
    }

    const next: GameState = { ...state, guesses, results, current: '', status }
    setState(next)
    saveState(next)
  }, [state, answer, stats, showMessage])

  const addLetter = useCallback(
    (letter: string) => {
      if (state.status !== 'playing') return
      if (state.current.length >= COLS) return
      const next = { ...state, current: state.current + letter.toUpperCase() }
      setState(next)
    },
    [state],
  )

  const deleteLetter = useCallback(() => {
    if (state.status !== 'playing') return
    if (state.current.length === 0) return
    const next = { ...state, current: state.current.slice(0, -1) }
    setState(next)
  }, [state])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter') {
        submitGuess()
      } else if (e.key === 'Backspace') {
        deleteLetter()
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addLetter(e.key)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [submitGuess, addLetter, deleteLetter])

  const handleKeyClick = (key: string) => {
    if (key === 'ENTER') submitGuess()
    else if (key === 'BACK') deleteLetter()
    else addLetter(key)
  }

  const newGame = () => {
    // Reset for today (mostly useful after win/loss to review)
    const fresh: GameState = {
      guesses: [],
      results: [],
      current: '',
      status: 'playing',
      answer,
    }
    setState(fresh)
    saveState(fresh)
  }

  return (
    <div className="wordle-layout">
      <div className="game-header-bar">
        <div className="game-stats-row">
          <span>Played: {stats.played}</span>
          <span>Won: {stats.won}</span>
        </div>
        {state.status !== 'playing' && (
          <button className="game-action-btn" onClick={newGame}>
            Play again
          </button>
        )}
      </div>

      {message && <div className="game-status-banner">{message}</div>}

      <div className="wordle-board">
        {Array.from({ length: ROWS }, (_, row) => {
          const isGuessed = row < state.guesses.length
          const isCurrent = row === state.guesses.length && state.status === 'playing'
          const word = isGuessed
            ? state.guesses[row]
            : isCurrent
              ? state.current
              : ''
          const result = isGuessed ? state.results[row] : undefined
          const shake = row === shakeRow

          return (
            <div
              key={row}
              className={`wordle-row${shake ? ' wordle-shake' : ''}`}
            >
              {Array.from({ length: COLS }, (_, col) => {
                const letter = word[col] ?? ''
                const cls = result
                  ? `wordle-cell wordle-${result[col]}`
                  : letter
                    ? 'wordle-cell wordle-filled'
                    : 'wordle-cell'
                return (
                  <div key={col} className={cls}>
                    {letter.toUpperCase()}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="wordle-keyboard">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="wordle-key-row">
            {row.map((key) => {
              const isWide = key === 'ENTER' || key === 'BACK'
              const ls = letterStates[key]
              const cls = [
                'wordle-key',
                isWide ? 'wordle-key-wide' : '',
                ls ? `wordle-${ls}` : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button key={key} className={cls} onClick={() => handleKeyClick(key)}>
                  {key === 'BACK' ? '\u232B' : key}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
