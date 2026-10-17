import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import Feed from './pages/Feed'
import Friends from './pages/Friends'
import BackgroundSpotlight from './BackgroundSpotlight'

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
    return (
      <div className="loading-screen" role="status">
        <img src="/logo.png" alt="Runora" width="56" height="56" />
        <p>Checking your login...</p>
        <span className="loading-line" aria-hidden="true" />
      </div>
    )
  }

  return (
    <>
      <BackgroundSpotlight />
      <div className={session ? 'app-shell' : 'app-shell auth-shell'}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="brand">
            <img src="/logo.png" alt="Runora logo" width="46" height="46" />

            <div>
              <p className="brand-name">Runora<span aria-hidden="true">.</span></p>
              <p>Running, together.</p>
            </div>
          </div>

          <nav className="site-nav" aria-label="Main navigation">
            {session ? (
              <>
                <button
                  aria-current={page === 'feed' ? 'page' : undefined}
                  className={
                    page === 'feed'
                      ? 'nav-button active'
                      : 'nav-button'
                  }
                  onClick={() => setPage('feed')}
                >
                  Feed
                </button>
                <button
                  aria-current={page === 'friends' ? 'page' : undefined}
                  className={
                    page === 'friends'
                      ? 'nav-button active'
                      : 'nav-button'
                  }
                  onClick={() => setPage('friends')}
                >
                  Friends
                </button>
                <button
                  aria-current={page === 'profile' ? 'page' : undefined}
                  className={
                    page === 'profile'
                      ? 'nav-button active'
                      : 'nav-button'
                  }
                  onClick={() => setPage('profile')}
                >
                  My profile
                </button>

                <button
                  className="nav-button logout-button"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <button
                  aria-current={page === 'login' ? 'page' : undefined}
                  className={
                    page === 'login'
                      ? 'nav-button active'
                      : 'nav-button'
                  }
                  onClick={() => setPage('login')}
                >
                  Log in
                </button>

                <button
                  aria-current={page === 'signup' ? 'page' : undefined}
                  className={
                    page === 'signup'
                      ? 'nav-button active'
                      : 'nav-button'
                  }
                  onClick={() => setPage('signup')}
                >
                  Sign up
                </button>
              </>
            )}
          </nav>
        </header>

        {authError && (
          <p className="notice error-notice" role="alert">
            {authError}
          </p>
        )}

        {session ? (
          <main className="page-content" id="main-content" tabIndex={-1}>
            {page === 'feed' && (
              <Feed token={session.access_token} />
            )}

            {page === 'profile' && (
              <Profile token={session.access_token} />
            )}

            {page === 'friends' && (
              <Friends token={session.access_token} />
            )}
          </main>
        ) : (
          <main className="auth-layout" id="main-content" tabIndex={-1}>
            <section className="auth-story" aria-labelledby="story-title">
              <p className="eyebrow"><span className="accent-line" /> A COMMUNITY IN MOTION</p>
              <h1 id="story-title">Every run.<br />A little<br /><em>further.</em></h1>
              <p className="story-description">Find your people. Share your miles.<br />Make the everyday run mean more.</p>
              <div className="story-bottom">
                <span className="story-mark" aria-hidden="true">R<span>↗</span></span>
                <p>YOUR PACE.<br /><strong>YOUR PEOPLE.</strong></p>
              </div>
            </section>
            <div className="auth-card" key={page}>
              <div className="auth-card-inner">
                {page === 'signup' ? (
                  <Signup />
                ) : (
                  <>
                    <Login onLogin={handleLogin} />

                    <p className="auth-divider"><span>or continue with</span></p>

                    <button
                      className="google-button"
                      type="button"
                      onClick={handleGoogleLogin}
                    >
                      <span className="google-mark" aria-hidden="true">G</span>
                      Continue with Google
                    </button>
                  </>
                )}
              </div>
            </div>
          </main>
        )}
        <footer className="site-footer">
          <span>RUNORA <span className="footer-slash">/</span> RUNNING, TOGETHER.</span>
          <span>ONE RUN AT A TIME <span aria-hidden="true">↗</span></span>
        </footer>
      </div>
    </>
  )
}
