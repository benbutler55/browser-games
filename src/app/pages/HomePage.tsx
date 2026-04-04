import { Link } from 'react-router-dom'
import { GameCard } from '../../components/GameCard'
import { games } from '../../games/registry'

const checklist = [
  {
    title: 'Phase 1 - Foundation',
    summary: 'App shell, game registry, routing, styling system, and Pages-safe delivery.',
    items: [
      'Create the core React + TypeScript structure.',
      'Add a shared registry so new games plug in cleanly.',
      'Use hash-based routing to stay GitHub Pages compatible.',
    ],
  },
  {
    title: 'Phase 2 - Fast Game Wins',
    summary: 'Land the simplest rules-driven games first to prove the architecture.',
    items: [
      'Ship Noughts and Crosses with local play and an unbeatable AI mode.',
      'Ship Minesweeper with presets, timer, first-click safety, and best times.',
      'Persist settings that matter across refreshes.',
    ],
  },
  {
    title: 'Phase 3 - Motion Systems',
    summary: 'Introduce animation loops and continuous input handling.',
    items: [
      'Ship Pong with a responsive playfield, keyboard controls, and AI pacing.',
      'Refine pause, restart, scoring, and between-serve flow.',
      'Keep rendering isolated from game logic for easier testing.',
    ],
  },
  {
    title: 'Phase 4 - Rich Interaction',
    summary: 'Finish the first wave with card movement, validation, and polish.',
    items: [
      'Ship Klondike draw-one Solitaire with click-to-move play and validated pile rules.',
      'Use the first pass to prove card-state transitions before drag support.',
      'Refine onboarding, undo, hints, and end-state feedback.',
    ],
  },
]

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="panel hero-copy">
          <span className="eyebrow">Full first wave playable</span>
          <h1>Modern browser games, built to grow one title at a time.</h1>
          <p>
            This repo is set up as a static React app with a shared shell, a
            central game registry, and room to add future titles without
            rewriting the navigation or layout.
          </p>
          <div className="hero-actions">
            <Link to="/games/noughts-and-crosses" className="primary-button">
              Play Noughts and Crosses
            </Link>
            <a href="#roadmap" className="ghost-button">
              Read implementation plan
            </a>
          </div>
          <div className="hero-grid">
            <article className="stat-card">
              <strong>4 / 4</strong>
              <p>Initial games now playable in the first release wave.</p>
            </article>
            <article className="stat-card">
              <strong>Static</strong>
              <p>Local-friendly and GitHub Pages-ready with no backend required.</p>
            </article>
          </div>
        </div>

        <aside className="panel hero-panel">
          <div className="section-heading">
            <h2>Architecture pillars</h2>
            <p>Shared systems first, then game-specific rules and presentation.</p>
          </div>
          <div className="stats-grid">
            <article className="placeholder-card">
              <strong>Registry-first</strong>
              <p>Add new games by registering metadata and a component.</p>
            </article>
            <article className="placeholder-card">
              <strong>Responsive shell</strong>
              <p>One app frame for desktop and mobile browsing.</p>
            </article>
            <article className="placeholder-card">
              <strong>Static hosting</strong>
              <p>Hash routing avoids rewrite issues on GitHub Pages.</p>
            </article>
            <article className="placeholder-card">
              <strong>Polished UI</strong>
              <p>Light minimal styling with card surfaces and soft depth.</p>
            </article>
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>Game lineup</h2>
          <p>Each card leads to a dedicated route with scoped game details.</p>
        </div>
        <div className="games-grid">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      <section className="section" id="roadmap">
        <div className="section-heading">
          <h2>Execution checklist</h2>
          <p>The implementation plan is broken into delivery phases so the repo can grow safely.</p>
        </div>
        <div className="checklist-grid">
          {checklist.map((phase) => (
            <article className="checklist-item" key={phase.title}>
              <strong>{phase.title}</strong>
              <p>{phase.summary}</p>
              <ol>
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
