import { useState } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Feed from './pages/Feed'

export default function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState('login')

  function handleLogin(newSession) {
    setSession(newSession)
    setPage('feed')
  }

  function handleLogout() {
    setSession(null)
    setPage('login')
  }

  return (
    <main>
      <h1>Runora</h1>

      {session ? (
        <>
          <nav>
            <button onClick={() => setPage('feed')}>
              Feed
            </button>

            <button onClick={() => setPage('profile')}>
              My profile
            </button>

            <button onClick={handleLogout}>
              Log out
            </button>
          </nav>

          {page === 'feed' && (
            <Feed token={session.access_token} />
          )}

          {page === 'profile' && (
            <Profile token={session.access_token} />
          )}
        </>
      ) : (
        <>
          <nav>
            <button onClick={() => setPage('login')}>
              Log in
            </button>

            <button onClick={() => setPage('signup')}>
              Sign up
            </button>
          </nav>

          {page === 'signup' ? (
            <Signup />
          ) : (
            <Login onLogin={handleLogin} />
          )}
        </>
      )}
    </main>
  )
}