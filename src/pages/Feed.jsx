import { useEffect, useState } from 'react'
import { ENDPOINTS } from '../api'

export default function Feed({ token }) {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [content, setContent] = useState('')
    const [visibility, setVisibility] = useState('public')
    const [file, setFile] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState('')
    const [refreshCount, setRefreshCount] = useState(0)

    useEffect(() => {
        async function loadPosts() {
            setLoading(true)
            setError('')
            setPosts([])

            try {
                // Load only the posts this user is allowed to see
                const response = await fetch(ENDPOINTS.posts, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                const data = await response.json()

                if (response.status === 401) {
                    throw new Error('Please log out and log in again')
                }

                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load posts')
                }

                setPosts(data)
            } catch (error) {
                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        loadPosts()
    }, [token, refreshCount])

    async function handleCreatePost(event) {
        event.preventDefault()

        if (submitting) {
            return
        }

        setMessage('')

        if (!content.trim()) {
            setMessage('Write something before posting')
            return
        }

        // Do not silently discard an image that cannot be uploaded yet
        if (file) {
            setMessage(
                'Image uploads will be added in Checkpoint 4. Remove the image to publish a text post.'
            )
            return
        }

        setSubmitting(true)

        try {
            // The backend gets the author identity from the access token
            const response = await fetch(ENDPOINTS.posts, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    content: content.trim(),
                    visibility,
                }),
            })

            const data = await response.json()

            if (response.status === 401) {
                throw new Error('Please log out and log in again')
            }

            if (!response.ok) {
                throw new Error(data.error || 'Unable to create post')
            }

            // Clear the form after saving and reload the feed
            setContent('')
            setVisibility('public')
            setMessage('Post published successfully')
            setRefreshCount(refreshCount + 1)
        } catch (error) {
            setMessage(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section>
            <h2>Running feed</h2>

            <form onSubmit={handleCreatePost}>
                <h3>Share a running update</h3>

                <div>
                    <label htmlFor="post-content">Your post</label>
                    <textarea
                        id="post-content"
                        rows={4}
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="post-visibility">Who can see this?</label>
                    <select
                        id="post-visibility"
                        value={visibility}
                        onChange={(event) => setVisibility(event.target.value)}
                    >
                        <option value="public">Public</option>
                        <option value="friends-only">Friends-only</option>
                    </select>
                </div>

                <div>
                    <p>Running photo — uploads coming in Checkpoint 4</p>

                    {file ? (
                        <div>
                            <p>Selected: {file.name}</p>
                            <button
                                type="button"
                                onClick={() => setFile(null)}
                            >
                                Remove image
                            </button>
                        </div>
                    ) : (
                        <>
                            <label htmlFor="post-image">Choose an image</label>
                            <input
                                id="post-image"
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    setFile(event.target.files[0] || null)
                                }
                            />
                        </>
                    )}
                </div>

                <button type="submit">
                    {submitting ? 'Publishing...' : 'Publish post'}
                </button>

                {message && <p>{message}</p>}
            </form>

            <hr />

            {loading && <p>Loading posts...</p>}

            {error && <p>{error}</p>}

            {!loading && !error && posts.length === 0 && (
                <p>No posts yet.</p>
            )}

            {posts.map((post) => (
                <div key={post.id}>
                    <h3>{post.author}</h3>

                    <p>
                        {post.visibility === 'friends-only'
                            ? 'Friends-only'
                            : 'Public'}
                    </p>

                    <p>{post.content}</p>
                    <p>Posted: {post.created_at}</p>
                    <hr />
                </div>
            ))}
        </section>
    )
}