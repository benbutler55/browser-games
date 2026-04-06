import { NavLink, Outlet } from 'react-router-dom'
import { games } from '../../games/registry'
import { useTheme } from '../../lib/useTheme'

export function AppShell() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <div className="brand-mark" aria-hidden="true">
            BG
          </div>
          <div className="brand-copy">
            <strong>Browser Games</strong>
            <span>Static arcade lounge for the web</span>
          </div>
        </NavLink>
        <nav aria-label="Games">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'pill-link active' : 'pill-link'
            }
          >
            Home
          </NavLink>
          {games.map((game) => (
            <NavLink
              key={game.slug}
              to={`/games/${game.slug}`}
              className={({ isActive }) =>
                isActive ? 'pill-link active' : 'pill-link'
              }
            >
              {game.name}
            </NavLink>
          ))}
        </nav>
        <button
          className="ghost-button"
          onClick={() =>
            setTheme(
              theme === 'dark'
                ? 'light'
                : theme === 'light'
                  ? 'system'
                  : 'dark',
            )
          }
          aria-label="Toggle theme"
          title={`Theme: ${theme}`}
        >
          {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Auto'}
        </button>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
