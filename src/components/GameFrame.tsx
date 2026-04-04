import type { GameDefinition } from '../games/types'

type GameFrameProps = {
  game: GameDefinition
}

export function GameFrame({ game }: GameFrameProps) {
  const Experience = game.playable ?? game.preview
  const hasPlayableBuild = Boolean(game.playable)
  const statusClassName = game.status.toLowerCase().replace(/\s+/g, '-')

  return (
    <section className="game-frame">
      <div className="frame-header">
        <div>
          <div className="tag-row">
            <span className={`status-chip ${statusClassName}`}>{game.status}</span>
            <span className="status-chip framework">{game.genre}</span>
          </div>
          <h1>{game.name}</h1>
          <p>{game.description}</p>
        </div>
        <div className="frame-actions">
          <a className="primary-button" href="#game-experience">
            {hasPlayableBuild ? 'Jump to playable build' : 'Preview planned build'}
          </a>
          <a className="ghost-button" href="#game-details">
            Rules and controls
          </a>
        </div>
      </div>

      <div id="game-experience">
        <Experience />
      </div>

      <div className="details-grid" id="game-details">
        <article className="game-detail">
          <strong>Implementation goals</strong>
          <ul className="rule-list">
            {game.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </article>

        <article className="game-detail">
          <strong>{hasPlayableBuild ? 'Current build details' : 'Planned first-version details'}</strong>
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
