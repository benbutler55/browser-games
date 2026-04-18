const PREVIEW_SIZE = 6

const previewCells = [
  ['ship', 'ship', 'ship', 'water', 'water', 'water'],
  ['water', 'water', 'water', 'water', 'miss', 'water'],
  ['water', 'hit', 'sunk', 'sunk', 'sunk', 'water'],
  ['water', 'water', 'water', 'water', 'water', 'water'],
  ['ship', 'ship', 'water', 'water', 'water', 'miss'],
  ['water', 'water', 'water', 'water', 'water', 'water'],
] as const

export function BattleshipsPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Place your fleet and outmaneuver an adaptive AI opponent.</h2>
          <p>Classic 10x10 Battleships with manual setup, random setup, and three difficulty levels.</p>
        </div>
        <span className="tag">Strategy</span>
      </div>

      <div
        className="battleships-preview-grid"
        style={{ gridTemplateColumns: `repeat(${PREVIEW_SIZE}, 1fr)` }}
        aria-hidden="true"
      >
        {previewCells.flat().map((state, index) => (
          <span key={index} className={`battleships-preview-cell ${state}`} />
        ))}
      </div>

      <p className="meta-note">
        Easy plays randomly, medium hunts around hits, and hard refines targets with checkerboard
        scanning and line continuation.
      </p>
    </article>
  )
}
