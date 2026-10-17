import { useState } from 'react'
import { ENDPOINTS } from '../api'

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSignup(event) {
        event.preventDefault()

        if (loading) {
            return
        }

        setMessage('')

        if (!email.trim() || !password) {
            setMessage('Enter your email and password')
            return
        }

        setLoading(true)

        try {
            // Ask the backend to create an account through Supabase Auth
            const response = await fetch(ENDPOINTS.signup, {
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
                throw new Error(data.error || 'Signup failed')
            }

            // Registration does not automatically log the user in
            setPassword('')
            setMessage(
                'Signup request accepted. Confirm your email if required, then log in.'
            )
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section aria-labelledby="signup-title">
            <p className="eyebrow">YOUR STARTING LINE</p>
            <h2 id="signup-title">Find your stride<span className="accent-text">.</span></h2>
            <p className="auth-description">Create your Runora account. All paces welcome.</p>

            <form onSubmit={handleSignup} aria-busy={loading}>
                <div>
                    <label htmlFor="signup-email">Email</label>
                    <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        disabled={loading}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="signup-password">Password</label>
                    <input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a password"
                        disabled={loading}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </div>

                <button className="primary-button" type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign up'}
                    <span className="button-arrow" aria-hidden="true">↗</span>
                </button>

                {message && <p className="notice" role="status">{message}</p>}
            </form>
        </section>
    )
}
