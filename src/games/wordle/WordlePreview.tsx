export function WordlePreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Guess the daily five-letter word in six tries.</h2>
          <p>Color-coded feedback guides each guess. A new word every day.</p>
        </div>
        <span className="tag">Preview</span>
      </div>
      <div className="wordle-row" style={{ maxWidth: 260, margin: '0 auto', gap: 6 }} aria-hidden="true">
        <div className="wordle-cell wordle-correct">C</div>
        <div className="wordle-cell wordle-present">R</div>
        <div className="wordle-cell wordle-absent">A</div>
        <div className="wordle-cell wordle-correct">N</div>
        <div className="wordle-cell wordle-absent">E</div>
      </div>
      <p className="meta-note">
        Daily word selection, on-screen keyboard, letter tracking, and localStorage persistence.
      </p>
    </article>
  )
}
