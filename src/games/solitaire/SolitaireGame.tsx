import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage'
import {
  autoMoveAvailableCardsToFoundations,
  canSelectFoundation,
  createInitialGame,
  drawFromStock,
  formatCardLabel,
  formatRank,
  formatSuitGlyph,
  getFoundationSuit,
  getSelectedCards,
  isRed,
  isValidTableauSelection,
  isWon,
  moveToFoundation,
  moveToTableau,
} from './gameLogic'
import type { GameState, Selection } from './gameLogic'

export function SolitaireGame() {
  const [wins, setWins] = useLocalStorage<number>('solitaire-wins', 0)
  const [gameState, setGameState] = useState<GameState>(() => createInitialGame())
  const [selection, setSelection] = useState<Selection | null>(null)
  const [dragSelection, setDragSelection] = useState<Selection | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  const won = useMemo(() => isWon(gameState), [gameState])
  const selectedCards = selection ? getSelectedCards(gameState, selection) : []

  useEffect(() => {
    if (!hasStarted || won) {
      return
    }

    const timer = window.setInterval(() => {
      setSeconds((currentSeconds) => currentSeconds + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [hasStarted, won])

  const statusMessage = won
      ? 'You solved the deck. Start a new deal to play again.'
    : dragSelection
      ? 'Drag the selected card or run onto a valid tableau column or foundation.'
    : selection
      ? `Selected ${selectedCards.length > 1 ? `${selectedCards.length} cards` : formatCardLabel(selectedCards[0])}. Choose a valid tableau or foundation target.`
      : gameState.stock.length === 0 && gameState.waste.length === 0
        ? 'No stock cards remain. Work the tableau and foundations to finish the deal.'
        : 'Click the stock to draw. Select or drag a waste card, foundation card, or tableau run onto a valid target.'

  function commitState(nextState: GameState, moveCount = 1) {
    if (!won && isWon(nextState)) {
      setWins((currentWins) => currentWins + 1)
    }

    setGameState(nextState)
    setSelection(null)
    setDragSelection(null)
    setDropTarget(null)
    setMoves((currentMoves) => currentMoves + moveCount)
    setHasStarted(true)
  }

  function resetGame() {
    setGameState(createInitialGame())
    setSelection(null)
    setDragSelection(null)
    setDropTarget(null)
    setMoves(0)
    setSeconds(0)
    setHasStarted(false)
  }

  function handleStockClick() {
    const result = drawFromStock(gameState)

    if (!result.moved) {
      return
    }

    commitState(result.state)
  }

  function handleAutoFoundation() {
    const result = autoMoveAvailableCardsToFoundations(gameState)

    if (result.movedCount === 0) {
      return
    }

    commitState(result.state, result.movedCount)
  }

  function handleWasteClick() {
    if (gameState.waste.length === 0) {
      return
    }

    if (selection?.type === 'waste') {
      setSelection(null)
      return
    }

    setSelection({ type: 'waste' })
  }

  function handleDragStart(event: DragEvent<HTMLElement>, nextSelection: Selection) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', 'solitaire-card')
    setDragSelection(nextSelection)
    setSelection(null)
  }

  function handleDragEnd() {
    setDragSelection(null)
    setDropTarget(null)
  }

  function handleFoundationDrop(foundationIndex: number) {
    const activeSelection = dragSelection ?? selection

    if (!activeSelection) {
      return
    }

    const nextState = moveToFoundation(gameState, activeSelection, foundationIndex)

    if (nextState) {
      commitState(nextState)
      return
    }

    setDragSelection(null)
    setDropTarget(null)
  }

  function handleTableauDrop(targetPileIndex: number) {
    const activeSelection = dragSelection ?? selection

    if (!activeSelection) {
      return
    }

    const nextState = moveToTableau(gameState, activeSelection, targetPileIndex)

    if (nextState) {
      commitState(nextState)
      return
    }

    setDragSelection(null)
    setDropTarget(null)
  }

  function handleFoundationClick(pileIndex: number) {
    if (selection) {
      const nextState = moveToFoundation(gameState, selection, pileIndex)

      if (nextState) {
        commitState(nextState)
        return
      }
    }

    if (!canSelectFoundation(gameState, pileIndex)) {
      return
    }

    if (selection?.type === 'foundation' && selection.pileIndex === pileIndex) {
      setSelection(null)
      return
    }

    setSelection({ type: 'foundation', pileIndex })
  }

  function handleTableauCardClick(pileIndex: number, cardIndex: number) {
    const card = gameState.tableau[pileIndex][cardIndex]

    if (!card.faceUp) {
      return
    }

    if (selection) {
      if (
        selection.type === 'tableau' &&
        selection.pileIndex === pileIndex &&
        selection.cardIndex === cardIndex
      ) {
        setSelection(null)
        return
      }

      const nextState = moveToTableau(gameState, selection, pileIndex)

      if (nextState) {
        commitState(nextState)
        return
      }
    }

    const nextSelection: Selection = {
      type: 'tableau',
      pileIndex,
      cardIndex,
    }

    if (!isValidTableauSelection(gameState, nextSelection)) {
      return
    }

    setSelection(nextSelection)
  }

  function handleEmptyTableauClick(pileIndex: number) {
    if (!selection) {
      return
    }

    const nextState = moveToTableau(gameState, selection, pileIndex)

    if (nextState) {
      commitState(nextState)
    }
  }

  function isCardSelected(pileIndex: number, cardIndex: number) {
    return (
      selection?.type === 'tableau' &&
      selection.pileIndex === pileIndex &&
      cardIndex >= selection.cardIndex
    )
  }

  return (
    <article className="game-preview-card playable-card solitaire-game">
      <div className="play-header">
        <div>
          <span className="eyebrow">Playable now</span>
          <h2>Klondike draw-three is live with click and drag play.</h2>
          <p>
            Solitaire now includes stock, waste, foundations, tableau rules,
            automatic card reveals, three-card stock draws, recycling the stock,
            and a clean mobile-safe click-and-drag interaction model.
          </p>
        </div>
        <div className="action-row solitaire-actions">
          <button className="primary-button" onClick={handleStockClick} type="button">
            {gameState.stock.length > 0 ? 'Draw three' : 'Recycle waste'}
          </button>
          <button className="ghost-button" onClick={handleAutoFoundation} type="button">
            Auto to foundations
          </button>
          <button className="ghost-button" onClick={resetGame} type="button">
            New deal
          </button>
          <button className="ghost-button" onClick={() => setSelection(null)} type="button">
            Clear selection
          </button>
        </div>
      </div>

      <div className="solitaire-layout">
        <div className="solitaire-main">
          <div className="score-grid solitaire-meta-grid">
            <article className="score-card">
              <span className="score-label">Moves</span>
              <strong>{moves}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Time</span>
              <strong>{seconds}s</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Wins</span>
              <strong>{wins}</strong>
            </article>
            <article className="score-card">
              <span className="score-label">Stock</span>
              <strong>{gameState.stock.length}</strong>
            </article>
          </div>

          <div className="status-panel" aria-live="polite">
            <strong>{statusMessage}</strong>
            <span>
              Move Aces up to the foundations, build tableau piles down by alternating colors, and only Kings can start empty tableau columns.
            </span>
          </div>

          <div className="solitaire-board-wrap">
            <div className="solitaire-board">
              <div className="solitaire-top-row">
                <div className="solitaire-deck-row">
                  <button className="solitaire-slot stock-slot" onClick={handleStockClick} type="button">
                    {gameState.stock.length > 0 ? (
                      <span className="solitaire-card-back">{gameState.stock.length}</span>
                    ) : (
                      <span className="slot-label">Recycle</span>
                    )}
                  </button>

                  <button
                    className={selection?.type === 'waste' ? 'solitaire-slot waste-slot selected-slot' : 'solitaire-slot waste-slot'}
                    onClick={handleWasteClick}
                    type="button"
                  >
                    {gameState.waste.length > 0 ? (
                      <span
                        draggable
                        onDragEnd={handleDragEnd}
                        onDragStart={(event) => handleDragStart(event, { type: 'waste' })}
                      >
                        <CardView
                          card={gameState.waste[gameState.waste.length - 1]}
                          selected={selection?.type === 'waste'}
                          dragged={dragSelection?.type === 'waste'}
                        />
                      </span>
                    ) : (
                      <span className="slot-label">Waste</span>
                    )}
                  </button>
                </div>

                <div className="solitaire-foundations">
                  {gameState.foundations.map((foundation, pileIndex) => {
                    const topCard = foundation[foundation.length - 1]
                    const isSelected =
                      selection?.type === 'foundation' && selection.pileIndex === pileIndex

                    return (
                      <button
                        key={pileIndex}
                        className={
                          dropTarget === `foundation-${pileIndex}`
                            ? 'solitaire-slot foundation-slot selected-slot'
                            : isSelected
                              ? 'solitaire-slot foundation-slot selected-slot'
                              : 'solitaire-slot foundation-slot'
                        }
                        onDragEnter={() => setDropTarget(`foundation-${pileIndex}`)}
                        onDragLeave={() => setDropTarget((currentTarget) => currentTarget === `foundation-${pileIndex}` ? null : currentTarget)}
                        onDragOver={(event) => {
                          event.preventDefault()
                          setDropTarget(`foundation-${pileIndex}`)
                        }}
                        onDrop={(event) => {
                          event.preventDefault()
                          handleFoundationDrop(pileIndex)
                        }}
                        onClick={() => handleFoundationClick(pileIndex)}
                        type="button"
                      >
                        {topCard ? (
                          <span
                            draggable
                            onDragEnd={handleDragEnd}
                            onDragStart={(event) =>
                              handleDragStart(event, { type: 'foundation', pileIndex })
                            }
                          >
                            <CardView
                              card={topCard}
                              selected={isSelected}
                              dragged={
                                dragSelection?.type === 'foundation' &&
                                dragSelection.pileIndex === pileIndex
                              }
                            />
                          </span>
                        ) : (
                          <span className="slot-label foundation-label">
                            {formatSuitGlyph(getFoundationSuit(pileIndex))}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="solitaire-tableau">
                {gameState.tableau.map((pile, pileIndex) => (
                  <div
                    className={dropTarget === `tableau-${pileIndex}` ? 'tableau-pile drop-target' : 'tableau-pile'}
                    key={pileIndex}
                    onDragEnter={() => setDropTarget(`tableau-${pileIndex}`)}
                    onDragLeave={() => setDropTarget((currentTarget) => currentTarget === `tableau-${pileIndex}` ? null : currentTarget)}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDropTarget(`tableau-${pileIndex}`)
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      handleTableauDrop(pileIndex)
                    }}
                  >
                    {pile.length === 0 ? (
                      <button
                        className={dropTarget === `tableau-${pileIndex}` ? 'solitaire-slot tableau-slot empty-tableau selected-slot' : 'solitaire-slot tableau-slot empty-tableau'}
                        onClick={() => handleEmptyTableauClick(pileIndex)}
                        type="button"
                      >
                        <span className="slot-label">King</span>
                      </button>
                    ) : null}

                    {pile.map((card, cardIndex) => (
                      <button
                        key={card.id}
                        className={
                          isCardSelected(pileIndex, cardIndex)
                            ? 'tableau-card selected-card'
                            : 'tableau-card'
                        }
                        onClick={() => handleTableauCardClick(pileIndex, cardIndex)}
                        style={{ top: `${cardIndex * (card.faceUp ? 1.7 : 0.75)}rem` }}
                        type="button"
                        draggable={card.faceUp && isValidTableauSelection(gameState, { type: 'tableau', pileIndex, cardIndex })}
                        onDragEnd={handleDragEnd}
                        onDragStart={(event) =>
                          handleDragStart(event, {
                            type: 'tableau',
                            pileIndex,
                            cardIndex,
                          })
                        }
                      >
                        <CardView
                          card={card}
                          selected={isCardSelected(pileIndex, cardIndex)}
                          dragged={
                            dragSelection?.type === 'tableau' &&
                            dragSelection.pileIndex === pileIndex &&
                            cardIndex >= dragSelection.cardIndex
                          }
                        />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="solitaire-side">
          <article className="game-detail">
            <strong>Current ruleset</strong>
            <ul className="rule-list">
              <li>Draw up to three cards at a time from the stock into the waste.</li>
              <li>Move cards to the foundations in ascending order by suit.</li>
              <li>Move tableau runs in descending order with alternating colors.</li>
              <li>You can move cards by click-to-move or by dragging them onto a valid pile.</li>
            </ul>
          </article>

          <article className="game-detail">
            <strong>Play tips</strong>
            <ul className="rule-list">
              <li>Turn over hidden tableau cards early; fresh information is usually worth more than a neat stack.</li>
              <li>Use auto-foundation once a suit is clearly safe to climb and you need to clear space quickly.</li>
              <li>Leave room for Kings, because empty tableau columns are your main source of mobility.</li>
              <li>Dragging whole tableau runs is often faster when you are reorganizing multiple columns.</li>
            </ul>
          </article>
        </aside>
      </div>
    </article>
  )
}

type CardViewProps = {
  card: GameState['stock'][number]
  selected?: boolean
  dragged?: boolean
}

function CardView({ card, selected = false, dragged = false }: CardViewProps) {
  if (!card.faceUp) {
    return (
      <span
        className={
          dragged
            ? selected
              ? 'solitaire-playing-card face-down selected-face dragged-face'
              : 'solitaire-playing-card face-down dragged-face'
            : selected
              ? 'solitaire-playing-card face-down selected-face'
              : 'solitaire-playing-card face-down'
        }
      />
    )
  }

  const rank = formatRank(card.rank)
  const suitGlyph = formatSuitGlyph(card.suit)
  const faceClassName = isRed(card)
    ? selected
      ? dragged
        ? 'solitaire-playing-card red-card selected-face dragged-face'
        : 'solitaire-playing-card red-card selected-face'
      : dragged
        ? 'solitaire-playing-card red-card dragged-face'
        : 'solitaire-playing-card red-card'
    : selected
      ? dragged
        ? 'solitaire-playing-card selected-face dragged-face'
        : 'solitaire-playing-card selected-face'
      : dragged
        ? 'solitaire-playing-card dragged-face'
        : 'solitaire-playing-card'

  return (
    <span className={faceClassName} aria-label={formatCardLabel(card)}>
      <span className="card-corner top-left">
        <span>{rank}</span>
        <span>{suitGlyph}</span>
      </span>
      <span className="card-corner bottom-right" aria-hidden="true">
        <span>{rank}</span>
        <span>{suitGlyph}</span>
      </span>
      {card.rank <= 10 ? (
        <span className={`card-pips rank-${card.rank}`} aria-hidden="true">
          {getPipRows(card.rank).map((count, rowIndex) => (
            <span className={count === 1 ? 'pip-row center' : 'pip-row'} key={`${card.id}-${rowIndex}`}>
              {Array.from({ length: count }, (_, pipIndex) => (
                <span className="pip" key={`${card.id}-${rowIndex}-${pipIndex}`}>
                  {suitGlyph}
                </span>
              ))}
            </span>
          ))}
        </span>
      ) : (
        <span className="face-illustration" aria-hidden="true">
          <span className="face-badge">{rank}</span>
          <span className="face-suit">{suitGlyph}</span>
          <span className="face-frame" />
        </span>
      )}
    </span>
  )
}

function getPipRows(rank: number) {
  switch (rank) {
    case 1:
      return [1]
    case 2:
      return [1, 1]
    case 3:
      return [1, 1, 1]
    case 4:
      return [2, 2]
    case 5:
      return [2, 1, 2]
    case 6:
      return [2, 2, 2]
    case 7:
      return [2, 1, 2, 2]
    case 8:
      return [2, 2, 2, 2]
    case 9:
      return [2, 2, 1, 2, 2]
    case 10:
      return [2, 2, 2, 2, 2]
    default:
      return [1]
  }
}
