const cells = [
  [5, 3, 0],
  [6, 0, 0],
  [0, 9, 8],
]

export function SudokuPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Classic number-placement puzzle.</h2>
          <p>Fill the 9x9 grid so every row, column, and 3x3 box contains 1 through 9.</p>
        </div>
        <span className="tag">Preview</span>
      </div>
      <div className="mines-grid" aria-hidden="true">
        {cells.flat().map((cell, index) => (
          <span key={index} style={{ fontWeight: cell ? 700 : 400 }}>
            {cell || '\u00B7'}
          </span>
        ))}
      </div>
      <p className="meta-note">
        Backtracking generator, pencil marks, and conflict highlighting make this a full-featured
        Sudoku experience.
      </p>
    </article>
  )
}
