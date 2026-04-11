const backRank = [
  { piece: '\u265C', dark: true },
  { piece: '\u265E', dark: false },
  { piece: '\u265D', dark: true },
  { piece: '\u265B', dark: false },
  { piece: '\u265A', dark: true },
  { piece: '\u265D', dark: false },
  { piece: '\u265E', dark: true },
  { piece: '\u265C', dark: false },
]
const pawnRank = [
  { piece: '\u265F', dark: false },
  { piece: '\u265F', dark: true },
  { piece: '\u265F', dark: false },
  { piece: '\u265F', dark: true },
  { piece: '\u265F', dark: false },
  { piece: '\u265F', dark: true },
  { piece: '\u265F', dark: false },
  { piece: '\u265F', dark: true },
]

const previewCells = [...backRank, ...pawnRank]

export function ChessPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>A full chess engine with three AI difficulty levels.</h2>
          <p>Castling, en passant, promotion, and checkmate detection are all implemented.</p>
        </div>
        <span className="tag">Strategy</span>
      </div>
      <div className="chess-preview-grid" aria-hidden="true">
        {previewCells.map((cell, index) => (
          <span
            key={index}
            className={`chess-preview-cell ${cell.dark ? 'dark' : 'light'}`}
          >
            {cell.piece}
          </span>
        ))}
      </div>
      <p className="meta-note">
        The AI uses alpha-beta pruning with piece-square tables, scaling from casual to challenging.
      </p>
    </article>
  )
}
