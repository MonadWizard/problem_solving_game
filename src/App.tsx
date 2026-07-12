import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import Layout from './components/Layout'
import MapScreen from './screens/MapScreen'
import IslandScreen from './screens/IslandScreen'
import ProfileScreen from './screens/ProfileScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import AboutScreen from './screens/AboutScreen'

// Hash routing: GitHub Pages serves only real files, and the Supabase OAuth
// callback (?code=...) precedes the # so PKCE works on every route.
// Rationale: .claude/skills/deploy/SKILL.md
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <MapScreen /> },
      { path: 'island/:journeyId/:islandId', element: <IslandScreen /> },
      { path: 'profile', element: <ProfileScreen /> },
      { path: 'leaderboard', element: <LeaderboardScreen /> },
      { path: 'about', element: <AboutScreen /> },
      { path: '*', element: <MapScreen /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
