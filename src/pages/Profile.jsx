import { useEffect, useState } from 'react'
import { ENDPOINTS } from '../api'

export default function Profile({ token }) {
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function loadProfile() {
            setLoading(true)
            setError('')
            setProfile(null)

            try {
                // Send the access token so the backend can identify this user
                const response = await fetch(ENDPOINTS.whoami, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                const data = await response.json()

                if (response.status === 401) {
                    throw new Error('Please log out and log in again')
                }

                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load your profile')
                }

                // Display the verified identity returned by the backend
                setProfile(data)
            } catch (error) {
                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [token])

    return (
        <section className="profile-page" aria-labelledby="profile-title">
            <div className="page-heading">
                <div>
                    <p className="eyebrow"><span className="accent-line" /> YOUR CORNER OF RUNORA</p>
                    <h1 id="profile-title">My profile<span className="accent-text">.</span></h1>
                </div>
                <p className="heading-note">Every runner has a story.<br />This is where yours begins.</p>
            </div>

            {loading && <p className="notice loading-notice" role="status">Loading your profile...</p>}

            {error && <p className="notice error-notice" role="alert">{error}</p>}

            {profile && (
                <div className="profile-layout">
                    <div className="profile-identity">
                        <span className="profile-avatar" aria-hidden="true">{profile.email ? profile.email[0] : 'R'}</span>
                        <p className="eyebrow">THE RUNNER BEHIND THE MILES</p>
                        <h2>{profile.email ? profile.email.split('@')[0] : 'Your account'}</h2>
                        <p className="profile-caption">Your pace. Your people.<br />Your place in the community.</p>
                    </div>
                    <div className="profile-card">
                        <div className="profile-card-inner">
                            <div className="section-heading"><h2>Account details</h2><span aria-hidden="true">↗</span></div>
                            <p className="profile-caption">The identity connected to your Runora account.</p>
                            <dl className="profile-details">
                                <div><dt>Email</dt><dd>{profile.email}</dd></div>
                                <div><dt>User ID</dt><dd className="profile-id">{profile.userId}</dd></div>
                            </dl>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
