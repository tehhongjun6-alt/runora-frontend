import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Feed from './pages/Feed'

export default function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState('login')
  const [checking, setChecking] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // Restore a saved session, including one returned by Google login
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          setAuthError(error.message)
        }

        setSession(data.session)

        if (data.session) {
          setPage('feed')
        }

        setChecking(false)
      })
      .catch((error) => {
        setAuthError(error.message)
        setChecking(false)
      })

    // Keep React updated when the session changes or the user logs out
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, currentSession) => {
        setSession(currentSession)

        if (event === 'SIGNED_OUT') {
          setPage('login')
        }
      })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogin(newSession) {
    setAuthError('')

    // Save the email/password login session in the Supabase client too
    const { data, error } = await supabase.auth.setSession({
      access_token: newSession.access_token,
      refresh_token: newSession.refresh_token,
    })

    if (error) {
      throw new Error(error.message)
    }

    setSession(data.session)
    setPage('feed')
  }

  async function handleGoogleLogin() {
    setAuthError('')

    // Send the user to Google and return to the site where login started
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setAuthError(error.message)
    }
  }

  async function handleLogout() {
    setAuthError('')

    // Remove the saved Supabase session, not just the React state
    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthError(error.message)
      return
    }

    setSession(null)
    setPage('login')
  }

  if (checking) {
    return <p>Checking your login...</p>
  }

  return (
    <main>
      <h1>Runora</h1>

      {authError && <p>{authError}</p>}

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
            <>
              <Login onLogin={handleLogin} />

              <p>Or</p>

              <button
                type="button"
                onClick={handleGoogleLogin}
              >
                Continue with Google
              </button>
            </>
          )}
        </>
      )}
    </main>
  )
}