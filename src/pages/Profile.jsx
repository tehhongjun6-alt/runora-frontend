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
        <section>
            <h2>My profile</h2>

            {loading && <p>Loading your profile...</p>}

            {error && <p>{error}</p>}

            {profile && (
                <div>
                    <p>Email: {profile.email}</p>
                    <p>User ID: {profile.userId}</p>
                </div>
            )}
        </section>
    )
}