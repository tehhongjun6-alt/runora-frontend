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
            onLogin(data.session)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section>
            <h2>Log in to Runora</h2>

            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>

                <button type="submit">
                    {loading ? 'Logging in...' : 'Log in'}
                </button>

                {error && <p>{error}</p>}
            </form>
        </section>
    )
}