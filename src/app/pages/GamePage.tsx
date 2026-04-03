import { Link, useParams } from 'react-router-dom'
import { GameFrame } from '../../components/GameFrame'
import { getGameBySlug } from '../../games/registry'

export function GamePage() {
  const { slug = '' } = useParams()
  const game = getGameBySlug(slug)

  if (!game) {
    return (
      <section className="panel not-found">
        <div className="section-heading">
          <h2>Game not found</h2>
          <p>That route is not registered yet. Head back to the lounge and pick another title.</p>
        </div>
        <Link to="/" className="primary-button">
          Return home
        </Link>
      </section>
    )
  }

  return <GameFrame game={game} />
}
