const cards = ['A♣', '7♥', 'K♠', 'Q♦']

export function SolitairePreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Solitaire is the richest interaction layer.</h2>
          <p>Card movement, pile rules, and future drag support depend on a strong shared state model.</p>
        </div>
        <span className="tag">Klondike draw-one</span>
      </div>
      <div className="solitaire-stack" aria-hidden="true">
        {cards.map((card) => (
          <span key={card} className="solitaire-card">
            {card}
          </span>
        ))}
      </div>
      <p className="meta-note">We will start with click-to-move interactions, then layer drag behavior once validation is solid.</p>
    </article>
  )
}
