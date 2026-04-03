import { createHashRouter } from 'react-router-dom'
import { AppShell } from './shell/AppShell'
import { GamePage } from './pages/GamePage'
import { HomePage } from './pages/HomePage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'games/:slug',
        element: <GamePage />,
      },
    ],
  },
])
