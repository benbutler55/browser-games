const cells = ['1', '', '2', '', '3', '', '', '1', '2']

export function MinesweeperPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Minesweeper adds real board-state logic.</h2>
          <p>Flood reveal, mine placement, timers, and difficulty presets arrive in this phase.</p>
        </div>
        <span className="tag">Preview</span>
      </div>
      <div className="mines-grid" aria-hidden="true">
        {cells.map((cell, index) => (
          <span key={`${cell}-${index}`}>{cell || '•'}</span>
        ))}
      </div>
      <p className="meta-note">The logic layer here will be highly testable because move resolution is pure and deterministic.</p>
    </article>
  )
}
