const marks = ['X', 'O', 'X', 'O', 'X', '', '', 'O', '']

export function NoughtsAndCrossesPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>The first playable target is small on purpose.</h2>
          <p>It will prove routing, board layout, turn state, restart controls, and win detection.</p>
        </div>
        <span className="tag">First build</span>
      </div>
      <div className="tic-grid" aria-hidden="true">
        {marks.map((mark, index) => (
          <span key={`${mark}-${index}`}>{mark || '·'}</span>
        ))}
      </div>
      <p className="meta-note">This game is the cleanest place to establish reusable patterns before the heavier titles land.</p>
    </article>
  )
}
