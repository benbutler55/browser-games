import type { GameDefinition } from '../games/types'

type GameFrameProps = {
  game: GameDefinition
}

export function GameFrame({ game }: GameFrameProps) {
  const Preview = game.preview

  return (
    <section className="game-frame">
      <div className="frame-header">
        <div>
          <div className="tag-row">
            <span className="status-chip planned">{game.status}</span>
            <span className="status-chip framework">{game.genre}</span>
          </div>
          <h1>{game.name}</h1>
          <p>{game.description}</p>
        </div>
        <div className="frame-actions">
          <button className="primary-button" type="button">
            Playable build coming soon
          </button>
          <button className="ghost-button" type="button">
            Rules and controls
          </button>
        </div>
      </div>

      <Preview />

      <div className="details-grid">
        <article className="game-detail">
          <strong>Implementation goals</strong>
          <ul className="rule-list">
            {game.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </article>

        <article className="game-detail">
          <strong>Planned first-version details</strong>
          <dl>
            <div>
              <dt>Controls</dt>
              <dd>{game.controls}</dd>
            </div>
            <div>
              <dt>Initial mode</dt>
              <dd>{game.initialMode}</dd>
            </div>
            <div>
              <dt>Expansion path</dt>
              <dd>{game.expansionPath}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  )
}
