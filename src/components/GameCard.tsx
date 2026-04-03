import { Link } from 'react-router-dom'
import type { GameDefinition } from '../games/types'

type GameCardProps = {
  game: GameDefinition
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link to={`/games/${game.slug}`} className="game-card">
      <div className="game-card-header">
        <div>
          <div className="status-chip planned">{game.status}</div>
          <h3>{game.name}</h3>
        </div>
        <span className="tag">{game.genre}</span>
      </div>

      <p>{game.description}</p>

      <div className="tag-row">
        {game.tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <ul>
        {game.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>

      <div className="game-card-footer">
        <span className="meta-note">Route: /#/games/{game.slug}</span>
        <span className="ghost-button">Open brief</span>
      </div>
    </Link>
  )
}
