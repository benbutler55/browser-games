import { describe, it, expect } from 'vitest'
import {
  createInitialGame,
  drawFromStock,
  isWon,
  hasLegalMove,
  formatRank,
  formatSuitGlyph,
  isRed,
  getFoundationSuit,
  type Card,
  type GameState,
} from './gameLogic'

describe('createInitialGame', () => {
  it('creates 7 tableau piles', () => {
    const game = createInitialGame()
    expect(game.tableau).toHaveLength(7)
  })

  it('gives each pile the correct number of cards (1 through 7)', () => {
    const game = createInitialGame()
    for (let i = 0; i < 7; i++) {
      expect(game.tableau[i]).toHaveLength(i + 1)
    }
  })

  it('has only the top card of each pile face up', () => {
    const game = createInitialGame()
    for (let i = 0; i < 7; i++) {
      const pile = game.tableau[i]
      for (let j = 0; j < pile.length - 1; j++) {
        expect(pile[j].faceUp).toBe(false)
      }
      expect(pile[pile.length - 1].faceUp).toBe(true)
    }
  })

  it('puts the remaining 24 cards in the stock', () => {
    const game = createInitialGame()
    // 52 - (1+2+3+4+5+6+7) = 52 - 28 = 24
    expect(game.stock).toHaveLength(24)
  })

  it('has all stock cards face down', () => {
    const game = createInitialGame()
    for (const card of game.stock) {
      expect(card.faceUp).toBe(false)
    }
  })

  it('starts with 4 empty foundations', () => {
    const game = createInitialGame()
    expect(game.foundations).toHaveLength(4)
    for (const foundation of game.foundations) {
      expect(foundation).toHaveLength(0)
    }
  })

  it('starts with an empty waste pile', () => {
    const game = createInitialGame()
    expect(game.waste).toHaveLength(0)
  })

  it('uses all 52 unique cards', () => {
    const game = createInitialGame()
    const allCards = [
      ...game.stock,
      ...game.waste,
      ...game.foundations.flat(),
      ...game.tableau.flat(),
    ]
    expect(allCards).toHaveLength(52)
    const ids = new Set(allCards.map((c) => c.id))
    expect(ids.size).toBe(52)
  })
})

describe('drawFromStock', () => {
  it('draws 3 cards from the stock to the waste', () => {
    const game = createInitialGame()
    const { moved, state } = drawFromStock(game)
    expect(moved).toBe(true)
    expect(state.stock).toHaveLength(21)
    expect(state.waste).toHaveLength(3)
  })

  it('draws all remaining cards when fewer than 3 remain', () => {
    // Create a state with exactly 2 cards in stock
    const state: GameState = {
      stock: [
        { id: 'hearts-1', suit: 'hearts', rank: 1, faceUp: false },
        { id: 'hearts-2', suit: 'hearts', rank: 2, faceUp: false },
      ],
      waste: [],
      foundations: Array.from({ length: 4 }, () => []),
      tableau: Array.from({ length: 7 }, () => []),
    }
    const { moved, state: nextState } = drawFromStock(state)
    expect(moved).toBe(true)
    expect(nextState.stock).toHaveLength(0)
    expect(nextState.waste).toHaveLength(2)
  })

  it('drawn cards are face up', () => {
    const game = createInitialGame()
    const { state } = drawFromStock(game)
    for (const card of state.waste) {
      expect(card.faceUp).toBe(true)
    }
  })

  it('recycles waste back to stock when stock is empty', () => {
    const game = createInitialGame()
    // Drain the stock completely
    let state = game
    while (state.stock.length > 0) {
      state = drawFromStock(state).state
    }
    expect(state.stock).toHaveLength(0)
    const wasteCount = state.waste.length

    const { moved, state: recycled } = drawFromStock(state)
    expect(moved).toBe(true)
    expect(recycled.stock).toHaveLength(wasteCount)
    expect(recycled.waste).toHaveLength(0)
    // Recycled stock cards should be face down
    for (const card of recycled.stock) {
      expect(card.faceUp).toBe(false)
    }
  })

  it('returns moved false when both stock and waste are empty', () => {
    const emptyState: GameState = {
      stock: [],
      waste: [],
      foundations: Array.from({ length: 4 }, () => []),
      tableau: Array.from({ length: 7 }, () => []),
    }
    const { moved, state } = drawFromStock(emptyState)
    expect(moved).toBe(false)
    expect(state).toBe(emptyState)
  })
})

describe('isWon', () => {
  it('returns false for a new game', () => {
    expect(isWon(createInitialGame())).toBe(false)
  })

  it('returns true when all foundations have 13 cards', () => {
    const suits = ['clubs', 'diamonds', 'hearts', 'spades'] as const
    const wonState: GameState = {
      stock: [],
      waste: [],
      foundations: suits.map((suit) =>
        Array.from({ length: 13 }, (_, i) => ({
          id: `${suit}-${i + 1}`,
          suit,
          rank: i + 1,
          faceUp: true,
        })),
      ),
      tableau: Array.from({ length: 7 }, () => []),
    }
    expect(isWon(wonState)).toBe(true)
  })

  it('returns false when one foundation is incomplete', () => {
    const suits = ['clubs', 'diamonds', 'hearts', 'spades'] as const
    const state: GameState = {
      stock: [],
      waste: [],
      foundations: suits.map((suit, index) =>
        Array.from({ length: index === 0 ? 12 : 13 }, (_, i) => ({
          id: `${suit}-${i + 1}`,
          suit,
          rank: i + 1,
          faceUp: true,
        })),
      ),
      tableau: Array.from({ length: 7 }, () => []),
    }
    expect(isWon(state)).toBe(false)
  })
})

describe('hasLegalMove', () => {
  it('returns true when stock has cards', () => {
    const game = createInitialGame()
    expect(hasLegalMove(game)).toBe(true)
  })

  it('returns true when waste has cards', () => {
    const state: GameState = {
      stock: [],
      waste: [{ id: 'hearts-5', suit: 'hearts', rank: 5, faceUp: true }],
      foundations: Array.from({ length: 4 }, () => []),
      tableau: Array.from({ length: 7 }, () => []),
    }
    expect(hasLegalMove(state)).toBe(true)
  })

  it('returns false when no moves exist', () => {
    // Construct a state with no legal moves: empty stock/waste,
    // tableau cards that can't move anywhere
    const state: GameState = {
      stock: [],
      waste: [],
      foundations: Array.from({ length: 4 }, () => []),
      tableau: [
        // A face-up 2 of hearts alone - can't go to foundation (not an ace), can't go to empty pile (not a king)
        [{ id: 'hearts-2', suit: 'hearts', rank: 2, faceUp: true }],
        // A face-up 2 of spades alone - same situation
        [{ id: 'spades-2', suit: 'spades', rank: 2, faceUp: true }],
        [],
        [],
        [],
        [],
        [],
      ],
    }
    // The 2 of hearts can't go on the 2 of spades (same rank).
    // Neither can go to foundation (not aces) or empty tableau (not kings).
    expect(hasLegalMove(state)).toBe(false)
  })
})

describe('formatRank', () => {
  it('returns A for rank 1', () => {
    expect(formatRank(1)).toBe('A')
  })

  it('returns J for rank 11', () => {
    expect(formatRank(11)).toBe('J')
  })

  it('returns Q for rank 12', () => {
    expect(formatRank(12)).toBe('Q')
  })

  it('returns K for rank 13', () => {
    expect(formatRank(13)).toBe('K')
  })

  it('returns the number as string for ranks 2-10', () => {
    for (let rank = 2; rank <= 10; rank++) {
      expect(formatRank(rank)).toBe(`${rank}`)
    }
  })
})

describe('formatSuitGlyph', () => {
  it('returns club symbol', () => {
    expect(formatSuitGlyph('clubs')).toBe('♣')
  })

  it('returns diamond symbol', () => {
    expect(formatSuitGlyph('diamonds')).toBe('♦')
  })

  it('returns heart symbol', () => {
    expect(formatSuitGlyph('hearts')).toBe('♥')
  })

  it('returns spade symbol', () => {
    expect(formatSuitGlyph('spades')).toBe('♠')
  })
})

describe('isRed', () => {
  it('returns true for diamonds', () => {
    const card: Card = { id: 'diamonds-1', suit: 'diamonds', rank: 1, faceUp: true }
    expect(isRed(card)).toBe(true)
  })

  it('returns true for hearts', () => {
    const card: Card = { id: 'hearts-1', suit: 'hearts', rank: 1, faceUp: true }
    expect(isRed(card)).toBe(true)
  })

  it('returns false for clubs', () => {
    const card: Card = { id: 'clubs-1', suit: 'clubs', rank: 1, faceUp: true }
    expect(isRed(card)).toBe(false)
  })

  it('returns false for spades', () => {
    const card: Card = { id: 'spades-1', suit: 'spades', rank: 1, faceUp: true }
    expect(isRed(card)).toBe(false)
  })
})

describe('getFoundationSuit', () => {
  it('returns clubs for index 0', () => {
    expect(getFoundationSuit(0)).toBe('clubs')
  })

  it('returns diamonds for index 1', () => {
    expect(getFoundationSuit(1)).toBe('diamonds')
  })

  it('returns hearts for index 2', () => {
    expect(getFoundationSuit(2)).toBe('hearts')
  })

  it('returns spades for index 3', () => {
    expect(getFoundationSuit(3)).toBe('spades')
  })
})
