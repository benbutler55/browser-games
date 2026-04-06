export type LetterResult = 'correct' | 'present' | 'absent'

export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  const results: LetterResult[] = Array(5).fill('absent')
  const remaining = answer.split('')

  // First pass: mark exact matches
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      results[i] = 'correct'
      remaining[i] = ''
    }
  }

  // Second pass: mark present letters (consuming from remaining pool)
  for (let i = 0; i < 5; i++) {
    if (results[i] === 'correct') continue
    const idx = remaining.indexOf(guess[i])
    if (idx !== -1) {
      results[i] = 'present'
      remaining[idx] = ''
    }
  }

  return results
}

export function getWordForDate(words: string[], date: Date): string {
  const epoch = new Date(2024, 0, 1)
  const msPerDay = 86_400_000
  const dayIndex = Math.floor((date.getTime() - epoch.getTime()) / msPerDay)
  return words[((dayIndex % words.length) + words.length) % words.length]
}

export function isValidWord(word: string, dictionary: Set<string>): boolean {
  return dictionary.has(word.toLowerCase())
}
