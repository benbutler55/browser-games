export function PongPreview() {
  const bars = [32, 52, 88, 58, 120, 76, 106, 64, 98, 54, 80, 42]

  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Pong will validate the motion layer.</h2>
          <p>Animation timing, keyboard input, scoring, and AI pacing all live here.</p>
        </div>
        <span className="tag">Preview</span>
      </div>
      <div className="board-sample" aria-hidden="true">
        {bars.map((height, index) => (
          <span
            key={height}
            className={`board-bar${index === 4 || index === 8 ? ' accent' : ''}`}
            style={{ height }}
          />
        ))}
      </div>
      <p className="meta-note">First release focus: one-player match flow, responsive arena sizing, and clean input handling.</p>
    </article>
  )
}
