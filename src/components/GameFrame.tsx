import type { GameDefinition } from '../games/types'

type GameFrameProps = {
  game: GameDefinition
}

export function GameFrame({ game }: GameFrameProps) {
  const Experience = game.playable ?? game.preview
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
          <div className="game-meta">
            <span>
              <strong>Controls:</strong> {game.controls}
            </span>
            <span>
              <strong>Mode:</strong> {game.initialMode}
            </span>
          </div>
        </div>
      </div>

      <div id="game-experience">
        <Experience />
      </div>
    </section>
  )
}
