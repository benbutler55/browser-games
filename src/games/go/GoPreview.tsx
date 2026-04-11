/** Sample stones for the 5x5 mini board preview */
const PREVIEW_SIZE = 5
const PREVIEW_PADDING = 8
const PREVIEW_CELL = 20
const PREVIEW_SVG = PREVIEW_CELL * (PREVIEW_SIZE - 1) + PREVIEW_PADDING * 2

type SampleStone = { row: number; col: number; color: 'black' | 'white' }

const sampleStones: SampleStone[] = [
  { row: 1, col: 1, color: 'black' },
  { row: 1, col: 3, color: 'white' },
  { row: 2, col: 2, color: 'black' },
  { row: 3, col: 1, color: 'white' },
  { row: 3, col: 3, color: 'black' },
  { row: 2, col: 3, color: 'white' },
]

function px(index: number) {
  return PREVIEW_PADDING + index * PREVIEW_CELL
}

export function GoPreview() {
  return (
    <article className="game-preview-card">
      <div className="game-preview-header">
        <div>
          <h2>Surround territory and capture stones on a 9x9 board.</h2>
          <p>Full Go rules with ko, suicide prevention, and territory scoring with komi.</p>
        </div>
        <span className="tag">Strategy</span>
      </div>
      <svg
        className="go-preview-board"
        viewBox={`0 0 ${PREVIEW_SVG} ${PREVIEW_SVG}`}
        width={PREVIEW_SVG}
        height={PREVIEW_SVG}
        aria-hidden="true"
      >
        {/* Wood background */}
        <rect width={PREVIEW_SVG} height={PREVIEW_SVG} fill="#dcb35c" rx={4} />

        {/* Grid lines */}
        {Array.from({ length: PREVIEW_SIZE }, (_, i) => (
          <line
            key={`ph-${i}`}
            x1={px(0)}
            y1={px(i)}
            x2={px(PREVIEW_SIZE - 1)}
            y2={px(i)}
            stroke="#333"
            strokeWidth={0.6}
          />
        ))}
        {Array.from({ length: PREVIEW_SIZE }, (_, i) => (
          <line
            key={`pv-${i}`}
            x1={px(i)}
            y1={px(0)}
            x2={px(i)}
            y2={px(PREVIEW_SIZE - 1)}
            stroke="#333"
            strokeWidth={0.6}
          />
        ))}

        {/* Center star point */}
        <circle cx={px(2)} cy={px(2)} r={2} fill="#333" />

        {/* Sample stones */}
        {sampleStones.map((s) => (
          <circle
            key={`${s.row}-${s.col}`}
            cx={px(s.col)}
            cy={px(s.row)}
            r={PREVIEW_CELL * 0.42}
            fill={s.color === 'black' ? '#111' : '#eee'}
            stroke={s.color === 'black' ? '#333' : '#999'}
            strokeWidth={0.8}
          />
        ))}
      </svg>
      <p className="meta-note">
        The AI uses Monte Carlo tree search, scaling from casual to competitive across three difficulty levels.
      </p>
    </article>
  )
}
