export function SnakePreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Guide the snake to collect food and grow.</h2>
          <p>Arrow keys, WASD, or swipe controls on a 20x20 grid with high score tracking.</p>
        </div>
        <span className="tag">Preview</span>
      </div>
      <div className="snake-preview-grid" aria-hidden="true">
        <span className="snake-preview-cell snake-head" />
        <span className="snake-preview-cell snake-body" />
        <span className="snake-preview-cell" />
        <span className="snake-preview-cell snake-body" />
        <span className="snake-preview-cell" />
        <span className="snake-preview-cell" />
        <span className="snake-preview-cell" />
        <span className="snake-preview-cell" />
        <span className="snake-preview-cell snake-food" />
      </div>
      <p className="meta-note">
        Pure game logic with full test coverage. Swipe support, pause, and persistent high scores.
      </p>
    </article>
  )
}
