import { Link } from 'react-router-dom'
import { GameCard } from '../../components/GameCard'
import { games } from '../../games/registry'

export function HomePage() {
  return (
    <>
      <section className="hero hero-single">
        <div className="panel hero-copy">
          <span className="eyebrow">Twelve games ready to play</span>
          <h1>Choose a game and jump straight in.</h1>
          <p>
            Pong, Minesweeper, Noughts and Crosses, Solitaire, 2048, Snake,
            Wordle, Tetris, Sudoku, Chess, Go, and Battleships all run directly in the
            browser with a simple, static, local-friendly setup.
          </p>
          <div className="hero-actions">
            <Link to="/games/pong" className="primary-button">
              Play Pong
            </Link>
            <a href="#games" className="ghost-button">
              Browse games
            </a>
          </div>
          <div className="hero-grid">
            <article className="stat-card">
              <strong>12 games</strong>
              <p>All twelve games now playable across three release waves.</p>
            </article>
            <article className="stat-card">
              <strong>Static</strong>
              <p>Local-friendly and GitHub Pages-ready with no backend required.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="games">
        <div className="section-heading">
          <h2>Game lineup</h2>
          <p>Pick a route and start playing.</p>
        </div>
        <div className="games-grid">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </>
  )
}
