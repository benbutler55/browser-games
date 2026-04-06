import { describe, it, expect } from 'vitest'
import { evaluateGuess, getWordForDate, isValidWord } from './gameLogic'

describe('evaluateGuess', () => {
  it('marks all correct when guess matches answer', () => {
    expect(evaluateGuess('apple', 'apple')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ])
  })

  it('marks all absent when no letters overlap', () => {
    expect(evaluateGuess('brick', 'songs')).toEqual([
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ])
  })

  it('marks present letters in wrong positions', () => {
    expect(evaluateGuess('heart', 'earth')).toEqual([
      'present',
      'present',
      'present',
      'present',
      'present',
    ])
  })

  it('handles mix of correct, present, and absent', () => {
    expect(evaluateGuess('crane', 'crate')).toEqual([
      'correct',
      'correct',
      'correct',
      'absent',
      'correct',
    ])
  })

  it('handles duplicate letters: guess has more of a letter than answer', () => {
    // guess 'speed' vs answer 'abide'
    // s->absent, p->absent, e->present (e exists in abide), e->correct (pos 3), d->absent
    // Wait: abide = a,b,i,d,e. speed = s,p,e,e,d
    // First pass: pos 3 e vs d -> no. pos 4 d vs e -> no. No exact matches.
    // Actually let me recount: speed[0]=s, speed[1]=p, speed[2]=e, speed[3]=e, speed[4]=d
    // abide[0]=a, abide[1]=b, abide[2]=i, abide[3]=d, abide[4]=e
    // First pass: no exact matches
    // Second pass: s not in abide->absent, p not in abide->absent,
    //   e in remaining [a,b,i,d,e] -> present (consume e),
    //   e not in remaining [a,b,i,d,''] -> absent,
    //   d in remaining [a,b,i,d,''] -> present (consume d)
    expect(evaluateGuess('speed', 'abide')).toEqual([
      'absent',
      'absent',
      'present',
      'absent',
      'present',
    ])
  })

  it('handles duplicate letters: alloy vs label', () => {
    // alloy = a,l,l,o,y  vs  label = l,a,b,e,l
    // First pass: no exact matches (a!=l, l!=a, l!=b, o!=e, y!=l)
    // Second pass:
    //   a: in remaining [l,a,b,e,l] -> present (consume a at idx 1)
    //   l: in remaining [l,'',b,e,l] -> present (consume l at idx 0)
    //   l: in remaining ['','',b,e,l] -> present (consume l at idx 4)
    //   o: not in remaining -> absent
    //   y: not in remaining -> absent
    expect(evaluateGuess('alloy', 'label')).toEqual([
      'present',
      'present',
      'present',
      'absent',
      'absent',
    ])
  })

  it('handles duplicate letters: correct consumes before present', () => {
    // guess 'geese' vs answer 'verge'
    // geese = g,e,e,s,e  vs  verge = v,e,r,g,e
    // First pass: pos 1 e=e -> correct, pos 4 e=e -> correct
    // remaining = [v,'',r,g,'']
    // Second pass:
    //   g: in remaining -> present (consume g)
    //   (pos 1 skipped - correct)
    //   e: not in remaining -> absent
    //   s: not in remaining -> absent
    //   (pos 4 skipped - correct)
    expect(evaluateGuess('geese', 'verge')).toEqual([
      'present',
      'correct',
      'absent',
      'absent',
      'correct',
    ])
  })
})

describe('getWordForDate', () => {
  it('returns a deterministic word for a given date', () => {
    const words = ['alpha', 'bravo', 'chess', 'delta', 'eagle']
    const date = new Date(2024, 0, 1)
    const word = getWordForDate(words, date)
    expect(words).toContain(word)
    // Same date should always return same word
    expect(getWordForDate(words, date)).toBe(word)
  })

  it('returns different words for different dates', () => {
    const words = ['alpha', 'bravo', 'chess', 'delta', 'eagle']
    const day1 = getWordForDate(words, new Date(2024, 0, 1))
    const day2 = getWordForDate(words, new Date(2024, 0, 2))
    expect(day1).not.toBe(day2)
  })

  it('wraps around the word list', () => {
    const words = ['alpha', 'bravo', 'chess']
    const word = getWordForDate(words, new Date(2024, 0, 4)) // day index 3 -> wraps to 0
    expect(words).toContain(word)
  })
})

describe('isValidWord', () => {
  it('returns true for a word in the dictionary', () => {
    const dict = new Set(['apple', 'crane', 'stove'])
    expect(isValidWord('crane', dict)).toBe(true)
  })

  it('returns false for a word not in the dictionary', () => {
    const dict = new Set(['apple', 'crane', 'stove'])
    expect(isValidWord('zzzzz', dict)).toBe(false)
  })

  it('is case insensitive', () => {
    const dict = new Set(['apple', 'crane'])
    expect(isValidWord('CRANE', dict)).toBe(true)
  })
})
