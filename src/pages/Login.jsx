import { useState } from 'react'
import { ENDPOINTS } from '../api'

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleLogin(event) {
        event.preventDefault()

        if (loading) {
            return
        }

        setError('')

        if (!email.trim() || !password) {
            setError('Enter your email and password')
            return
        }

        setLoading(true)

        try {
            // Send the login details to the Mission 9 backend
            const response = await fetch(ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Login failed')
            }

            if (!data.session || !data.session.access_token) {
                throw new Error('No access token was returned')
            }

            // Pass the session to App so other pages can use it
            setPassword('')
            await onLogin(data.session)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section aria-labelledby="login-title">
            <p className="eyebrow">BACK IN YOUR STRIDE</p>
            <h2 id="login-title">Welcome back<span className="accent-text">.</span></h2>
            <p className="auth-description">Your next run starts with your community.</p>

            <form onSubmit={handleLogin} aria-busy={loading}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        disabled={loading}
                        aria-describedby={error ? 'login-error' : undefined}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        disabled={loading}
                        aria-describedby={error ? 'login-error' : undefined}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>

                <button className="primary-button" type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log in'}
                    <span className="button-arrow" aria-hidden="true">↗</span>
                </button>

                {error && <p id="login-error" className="notice error-notice" role="alert">{error}</p>}
            </form>
        </section>
    )
}
