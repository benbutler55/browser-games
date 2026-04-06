const tiles = [2, 4, 8, 16, 32, 64, 128, 256, 512]

export function TwentyFortyEightPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Slide and merge tiles to reach 2048.</h2>
          <p>Arrow keys and swipe gestures on a classic 4x4 board with undo and score tracking.</p>
        </div>
        <span className="tag">Preview</span>
      </div>
      <div className="twenty48-preview-grid" aria-hidden="true">
        {tiles.map((value) => (
          <span key={value} className={`twenty48-preview-tile tile-${value}`}>
            {value}
          </span>
        ))}
      </div>
      <p className="meta-note">
        Pure game logic with full test coverage. Swipe support and persistent high scores included.
      </p>
    </article>
  )
}
