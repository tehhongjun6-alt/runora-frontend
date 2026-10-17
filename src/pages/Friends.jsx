import { useEffect, useState } from 'react'
import { ENDPOINTS } from '../api'

// 使用现有 access token 请求后端
async function requestAPI(url, token, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    const data = await response.json()

    if (!response.ok) {
        const error = new Error(
            response.status === 401
                ? 'Please log out and log in again.'
                : data.error || 'Request failed.'
        )

        error.status = response.status
        throw error
    }

    return data
}

export default function Friends({ token }) {
    const [users, setUsers] = useState([])
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [feedback, setFeedback] = useState(null)
    const [busy, setBusy] = useState('')
    const [statuses, setStatuses] = useState({})
    const [refresh, setRefresh] = useState(0)

    useEffect(() => {
        let active = true

        async function loadFriends() {
            setLoading(true)
            setError('')

            try {
                const [people, pending] = await Promise.all([
                    requestAPI(ENDPOINTS.users, token),
                    requestAPI(ENDPOINTS.friendRequests, token),
                ])

                if (!Array.isArray(people) || !Array.isArray(pending)) {
                    throw new Error('Unexpected response from the server.')
                }

                if (active) {
                    setUsers(people)
                    setRequests(pending)
                }
            } catch (error) {
                if (active) setError(error.message)
            } finally {
                if (active) setLoading(false)
            }
        }

        loadFriends()

        return () => {
            active = false
        }
    }, [token, refresh])

    async function sendRequest(user) {
        setBusy(`send-${user.id}`)
        setFeedback(null)

        try {
            await requestAPI(ENDPOINTS.friend, token, {
                method: 'POST',
                body: JSON.stringify({
                    friendId: user.id,
                }),
            })

            setStatuses((current) => ({
                ...current,
                [user.id]: 'Request sent',
            }))

            setFeedback({
                type: 'success',
                text: `Friend request sent to ${user.username}.`,
            })
        } catch (error) {
            if (error.status === 409) {
                setStatuses((current) => ({
                    ...current,
                    [user.id]: 'Connected / pending',
                }))

                setFeedback({
                    type: 'success',
                    text: 'You are already friends, or a request already exists.',
                })
            } else {
                setFeedback({
                    type: 'error',
                    text: error.message,
                })
            }
        } finally {
            setBusy('')
        }
    }

    async function acceptRequest(request) {
        setBusy(`accept-${request.id}`)
        setFeedback(null)

        try {
            await requestAPI(
                `${ENDPOINTS.friend}/${request.id}/accept`,
                token,
                { method: 'PATCH' }
            )

            setRequests((current) =>
                current.filter((item) => item.id !== request.id)
            )

            setStatuses((current) => ({
                ...current,
                [request.requester_id]: 'Friends',
            }))

            setFeedback({
                type: 'success',
                text: `You and ${request.requester} are now friends.`,
            })
        } catch (error) {
            setFeedback({
                type: 'error',
                text: error.message,
            })
        } finally {
            setBusy('')
        }
    }

    return (
        <section aria-labelledby="friends-title">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        <span className="accent-line" />
                        YOUR RUNNING COMMUNITY
                    </p>

                    <h1 id="friends-title">
                        Friends<span className="accent-text">.</span>
                    </h1>
                </div>

                <button
                    className="secondary-button"
                    type="button"
                    disabled={loading || Boolean(busy)}
                    onClick={() => setRefresh((current) => current + 1)}
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {feedback && (
                <p
                    className={
                        feedback.type === 'error'
                            ? 'notice error-notice friends-feedback'
                            : 'notice friends-feedback'
                    }
                    role={feedback.type === 'error' ? 'alert' : 'status'}
                >
                    {feedback.text}
                </p>
            )}

            {loading && (
                <p className="notice loading-notice" role="status">
                    Loading your community...
                </p>
            )}

            {error && (
                <p className="notice error-notice" role="alert">
                    {error} Click Refresh to try again.
                </p>
            )}

            {!loading && !error && (
                <div className="friends-grid">
                    <section className="profile-card">
                        <div className="profile-card-inner">
                            <div className="section-heading">
                                <h2>Friend requests</h2>
                                <span>{requests.length}</span>
                            </div>

                            {requests.length === 0 && (
                                <p className="profile-caption">
                                    No pending friend requests.
                                </p>
                            )}

                            <ul className="friends-list">
                                {requests.map((request) => (
                                    <li className="friend-row" key={request.id}>
                                        <div className="post-author">
                                            <span className="author-avatar" aria-hidden="true">
                                                {(request.requester || 'R')[0]}
                                            </span>

                                            <h3>{request.requester || 'Runner'}</h3>
                                        </div>

                                        <button
                                            className="primary-button friend-action"
                                            type="button"
                                            disabled={Boolean(busy)}
                                            onClick={() => acceptRequest(request)}
                                        >
                                            {busy === `accept-${request.id}`
                                                ? 'Accepting...'
                                                : 'Accept'}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    <section className="profile-card">
                        <div className="profile-card-inner">
                            <div className="section-heading">
                                <h2>Find your people</h2>
                                <span aria-hidden="true">↗</span>
                            </div>

                            {users.length === 0 && (
                                <p className="profile-caption">
                                    No other runners yet.
                                </p>
                            )}

                            <ul className="friends-list">
                                {users.map((user) => {
                                    const incoming = requests.some(
                                        (request) => request.requester_id === user.id
                                    )

                                    return (
                                        <li className="friend-row" key={user.id}>
                                            <div className="post-author">
                                                <span className="author-avatar" aria-hidden="true">
                                                    {(user.username || 'R')[0]}
                                                </span>

                                                <h3>{user.username || 'Runner'}</h3>
                                            </div>

                                            <button
                                                className="secondary-button friend-action"
                                                type="button"
                                                disabled={
                                                    Boolean(busy) ||
                                                    Boolean(statuses[user.id]) ||
                                                    incoming
                                                }
                                                onClick={() => sendRequest(user)}
                                            >
                                                {busy === `send-${user.id}`
                                                    ? 'Sending...'
                                                    : statuses[user.id] ||
                                                    (incoming ? 'Accept in requests' : 'Add friend')}
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </section>
                </div>
            )}
        </section>
    )
}