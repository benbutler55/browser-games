export function TetrisPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Classic block-stacking with seven piece types.</h2>
          <p>
            Rotate, move, and drop pieces to clear lines. Ghost piece preview and level
            progression.
          </p>
        </div>
        <span className="tag">Preview</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px',
          width: '80px',
          margin: '12px auto',
        }}
        aria-hidden="true"
      >
        <span className="tetris-cell piece-t" style={{ width: '100%', aspectRatio: '1', borderRadius: '3px' }} />
        <span className="tetris-cell piece-i" style={{ width: '100%', aspectRatio: '1', borderRadius: '3px' }} />
        <span className="tetris-cell piece-s" style={{ width: '100%', aspectRatio: '1', borderRadius: '3px' }} />
        <span className="tetris-cell piece-o" style={{ width: '100%', aspectRatio: '1', borderRadius: '3px' }} />
        <span className="tetris-cell piece-z" style={{ width: '100%', aspectRatio: '1', borderRadius: '3px' }} />
        <span className="tetris-cell piece-j" style={{ width: '100%', aspectRatio: '1', borderRadius: '3px' }} />
        <span className="tetris-cell piece-l" style={{ width: '100%', aspectRatio: '1', borderRadius: '3px' }} />
        <span className="tetris-cell piece-i" style={{ width: '100%', aspectRatio: '1', borderRadius: '3px' }} />
        <span className="tetris-cell piece-t" style={{ width: '100%', aspectRatio: '1', borderRadius: '3px' }} />
      </div>
      <p className="meta-note">
        Seven piece types with rotation, wall kicks, ghost preview, and scoring by level.
      </p>
    </article>
  )
}
