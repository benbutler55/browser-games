export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades'

export type Card = {
  id: string
  suit: Suit
  rank: number
  faceUp: boolean
}

export type GameState = {
  stock: Card[]
  waste: Card[]
  foundations: Card[][]
  tableau: Card[][]
}

export type Selection =
  | {
      type: 'waste'
    }
  | {
      type: 'foundation'
      pileIndex: number
    }
  | {
      type: 'tableau'
      pileIndex: number
      cardIndex: number
    }

const suits: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades']

export function createInitialGame(): GameState {
  const deck = shuffle(createDeck())
  const tableau: Card[][] = Array.from({ length: 7 }, () => [])
  let deckIndex = 0

  for (let pileIndex = 0; pileIndex < 7; pileIndex += 1) {
    for (let cardIndex = 0; cardIndex <= pileIndex; cardIndex += 1) {
      const card = deck[deckIndex]
      tableau[pileIndex].push({
        ...card,
        faceUp: cardIndex === pileIndex,
      })
      deckIndex += 1
    }
  }

  return {
    stock: deck.slice(deckIndex).map((card) => ({ ...card, faceUp: false })),
    waste: [],
    foundations: Array.from({ length: 4 }, () => []),
    tableau,
  }
}

export function drawFromStock(state: GameState) {
  if (state.stock.length > 0) {
    const stock = state.stock.slice(0, -1)
    const drawnCard = { ...state.stock[state.stock.length - 1], faceUp: true }

    return {
      moved: true,
      state: {
        ...state,
        stock,
        waste: [...state.waste, drawnCard],
      },
    }
  }

  if (state.waste.length === 0) {
    return {
      moved: false,
      state,
    }
  }

  return {
    moved: true,
    state: {
      ...state,
      stock: state.waste
        .slice()
        .reverse()
        .map((card) => ({ ...card, faceUp: false })),
      waste: [],
    },
  }
}

export function moveToFoundation(
  state: GameState,
  selection: Selection,
  foundationIndex: number,
) {
  const foundation = state.foundations[foundationIndex]

  if (selection.type === 'waste') {
    const card = state.waste[state.waste.length - 1]

    if (!card || !canPlaceOnFoundation(card, foundation)) {
      return null
    }

    return {
      ...state,
      waste: state.waste.slice(0, -1),
      foundations: replaceAt(state.foundations, foundationIndex, [...foundation, card]),
    }
  }

  if (selection.type === 'foundation') {
    return null
  }

  const sourcePile = state.tableau[selection.pileIndex]
  const card = sourcePile[selection.cardIndex]
  const isTopCard = selection.cardIndex === sourcePile.length - 1

  if (!card || !isTopCard || !canPlaceOnFoundation(card, foundation)) {
    return null
  }

  const nextSourcePile = revealLastCard(sourcePile.slice(0, -1))

  return {
    ...state,
    tableau: replaceAt(state.tableau, selection.pileIndex, nextSourcePile),
    foundations: replaceAt(state.foundations, foundationIndex, [...foundation, card]),
  }
}

export function moveToTableau(
  state: GameState,
  selection: Selection,
  targetPileIndex: number,
) {
  const targetPile = state.tableau[targetPileIndex]

  if (selection.type === 'waste') {
    const card = state.waste[state.waste.length - 1]

    if (!card || !canPlaceOnTableau(card, targetPile)) {
      return null
    }

    return {
      ...state,
      waste: state.waste.slice(0, -1),
      tableau: replaceAt(state.tableau, targetPileIndex, [...targetPile, card]),
    }
  }

  if (selection.type === 'foundation') {
    const sourcePile = state.foundations[selection.pileIndex]
    const card = sourcePile[sourcePile.length - 1]

    if (!card || !canPlaceOnTableau(card, targetPile)) {
      return null
    }

    return {
      ...state,
      foundations: replaceAt(
        state.foundations,
        selection.pileIndex,
        sourcePile.slice(0, -1),
      ),
      tableau: replaceAt(state.tableau, targetPileIndex, [...targetPile, card]),
    }
  }

  if (selection.pileIndex === targetPileIndex) {
    return null
  }

  const sourcePile = state.tableau[selection.pileIndex]
  const movingCards = sourcePile.slice(selection.cardIndex)

  if (!isValidTableauRun(movingCards) || !canPlaceOnTableau(movingCards[0], targetPile)) {
    return null
  }

  const nextSourcePile = revealLastCard(sourcePile.slice(0, selection.cardIndex))

  return {
    ...state,
    tableau: state.tableau.map((pile, pileIndex) => {
      if (pileIndex === selection.pileIndex) {
        return nextSourcePile
      }

      if (pileIndex === targetPileIndex) {
        return [...pile, ...movingCards]
      }

      return pile
    }),
  }
}

export function isValidTableauSelection(state: GameState, selection: Selection) {
  if (selection.type !== 'tableau') {
    return true
  }

  const pile = state.tableau[selection.pileIndex]
  const movingCards = pile.slice(selection.cardIndex)
  return isValidTableauRun(movingCards)
}

export function canSelectFoundation(state: GameState, foundationIndex: number) {
  return state.foundations[foundationIndex].length > 0
}

export function getSelectedCards(state: GameState, selection: Selection) {
  if (selection.type === 'waste') {
    const card = state.waste[state.waste.length - 1]
    return card ? [card] : []
  }

  if (selection.type === 'foundation') {
    const pile = state.foundations[selection.pileIndex]
    const card = pile[pile.length - 1]
    return card ? [card] : []
  }

  return state.tableau[selection.pileIndex].slice(selection.cardIndex)
}

export function isWon(state: GameState) {
  return state.foundations.every((foundation) => foundation.length === 13)
}

export function formatCardLabel(card: Card) {
  return `${formatRank(card.rank)}${formatSuitGlyph(card.suit)}`
}

export function formatRank(rank: number) {
  if (rank === 1) {
    return 'A'
  }

  if (rank === 11) {
    return 'J'
  }

  if (rank === 12) {
    return 'Q'
  }

  if (rank === 13) {
    return 'K'
  }

  return `${rank}`
}

export function formatSuitGlyph(suit: Suit) {
  switch (suit) {
    case 'clubs':
      return '♣'
    case 'diamonds':
      return '♦'
    case 'hearts':
      return '♥'
    case 'spades':
      return '♠'
  }
}

export function isRed(card: Card) {
  return card.suit === 'diamonds' || card.suit === 'hearts'
}

export function getFoundationSuit(pileIndex: number): Suit {
  return suits[pileIndex]
}

function createDeck() {
  return suits.flatMap((suit) =>
    Array.from({ length: 13 }, (_, index) => ({
      id: `${suit}-${index + 1}`,
      suit,
      rank: index + 1,
      faceUp: false,
    })),
  )
}

function shuffle<T>(items: T[]) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = current
  }

  return copy
}

function canPlaceOnFoundation(card: Card, foundation: Card[]) {
  if (foundation.length === 0) {
    return card.rank === 1
  }

  const topCard = foundation[foundation.length - 1]
  return topCard.suit === card.suit && topCard.rank === card.rank - 1
}

function canPlaceOnTableau(card: Card, tableauPile: Card[]) {
  if (tableauPile.length === 0) {
    return card.rank === 13
  }

  const topCard = tableauPile[tableauPile.length - 1]

  if (!topCard.faceUp) {
    return false
  }

  return topCard.rank === card.rank + 1 && isRed(topCard) !== isRed(card)
}

function isValidTableauRun(cards: Card[]) {
  if (cards.length === 0 || cards.some((card) => !card.faceUp)) {
    return false
  }

  for (let index = 0; index < cards.length - 1; index += 1) {
    const currentCard = cards[index]
    const nextCard = cards[index + 1]

    if (currentCard.rank !== nextCard.rank + 1 || isRed(currentCard) === isRed(nextCard)) {
      return false
    }
  }

  return true
}

function replaceAt<T>(items: T[], index: number, value: T) {
  return items.map((item, currentIndex) => (currentIndex === index ? value : item))
}

function revealLastCard(cards: Card[]) {
  if (cards.length === 0) {
    return cards
  }

  const nextCards = cards.slice()
  const lastCard = nextCards[nextCards.length - 1]

  if (!lastCard.faceUp) {
    nextCards[nextCards.length - 1] = { ...lastCard, faceUp: true }
  }

  return nextCards
}
