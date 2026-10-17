import { useEffect, useState } from 'react'
import { ENDPOINTS } from '../api'
import { supabase } from '../lib/supabaseClient'

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

        setSubmitting(true)

        // 没有选图片时，保存 null
        let imageUrl = null

        try {
            if (file) {
                // 获取当前用户，用用户 ID 建立图片文件夹
                const { data: userData, error: userError } =
                    await supabase.auth.getUser(token)

                if (userError || !userData.user) {
                    throw new Error('Please log out and log in again')
                }

                // 用户 ID + 时间 + 文件名，降低重名的可能
                const path =
                    `${userData.user.id}/${Date.now()}-${file.name}`

                setMessage('Uploading photo...')

                // 第一步：上传图片文件到 Storage
                const { error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(path, file, { cacheControl: '0' })

                if (uploadError) {
                    throw new Error(
                        `Image upload failed: ${uploadError.message}`
                    )
                }

                // 第二步：取得图片的公开网址
                const { data: urlData } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(path)

                imageUrl = urlData.publicUrl
            }

            setMessage('Saving post...')

            // 第三步：发送文字、可见性和图片地址给后端
            const response = await fetch(ENDPOINTS.posts, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    content: content.trim(),
                    visibility,
                    image_url: imageUrl,
                }),
            })

            const data = await response.json()

            if (response.status === 401) {
                throw new Error('Please log out and log in again')
            }

            if (!response.ok) {
                throw new Error(data.error || 'Unable to create post')
            }

            // 保存成功后清空表单，重新加载 Feed
            setContent('')
            setVisibility('public')
            setFile(null)
            setMessage('Post published successfully')
            setRefreshCount(refreshCount + 1)
        } catch (error) {
            if (imageUrl) {
                setMessage(
                    `The photo uploaded, but the post could not be confirmed saved. ${error.message}`
                )
            } else {
                setMessage(error.message)
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className="feed-page" aria-labelledby="feed-title">
            <div className="page-heading">
                <div>
                    <p className="eyebrow"><span className="accent-line" /> THE EVERYDAY RUN CLUB</p>
                    <h1 id="feed-title">Running feed<span className="accent-text">.</span></h1>
                </div>
                <p className="heading-note">Good runs. Real stories.<br />A little further, together.</p>
            </div>

            <div className="feed-layout">
                <form
                    className="post-composer"
                    onSubmit={handleCreatePost}
                    aria-busy={submitting}
                >
                    <div className="composer-inner">
                        <div className="composer-heading">
                            <span className="composer-plus" aria-hidden="true">+</span>
                            <h2>Create a post</h2>
                        </div>

                        <div className="form-group">
                            <label htmlFor="post-content">
                                Your update
                            </label>

                            <textarea
                                id="post-content"
                                rows={4}
                                placeholder="A new route, a small win… how was your run?"
                                value={content}
                                disabled={submitting}
                                onChange={(event) =>
                                    setContent(event.target.value)
                                }
                            />
                        </div>

                        <div className="visibility-row">
                            <label htmlFor="post-visibility">
                                Visibility
                            </label>

                            <select
                                id="post-visibility"
                                value={visibility}
                                disabled={submitting}
                                onChange={(event) =>
                                    setVisibility(event.target.value)
                                }
                            >
                                <option value="public">Public</option>
                                <option value="friends-only">
                                    Friends-only
                                </option>
                            </select>
                        </div>

                        <div className="upload-panel">
                            <label htmlFor={file ? undefined : 'post-image'}>
                                Add a photo <span className="optional-label">Optional</span>
                            </label>

                            {file ? (
                                <div>
                                    <p className="selected-file">
                                        {file.name}
                                    </p>

                                    <button
                                        className="secondary-button"
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => setFile(null)}
                                    >
                                        Remove image
                                    </button>
                                </div>
                            ) : (
                                <input
                                    className="file-input"
                                    id="post-image"
                                    aria-describedby="upload-help"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    disabled={submitting}
                                    onChange={(event) =>
                                        setFile(event.target.files[0] || null)
                                    }
                                />
                            )}
                            <p className="upload-help" id="upload-help">JPG / PNG / WebP · 2 MB max</p>
                        </div>

                        <button
                            className="publish-button"
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? 'Publishing...' : 'Publish post'}
                            <span className="button-arrow" aria-hidden="true">↗</span>
                        </button>

                        {message && (
                            <p className="notice" role="status">
                                {message}
                            </p>
                        )}
                    </div>
                </form>

                <div className="posts-list">
                    <div className="feed-list-heading"><h2>From the community</h2><span className="list-marker" aria-hidden="true" /></div>
                    {loading && (
                        <p className="notice loading-notice" role="status">
                            Loading posts...
                        </p>
                    )}

                    {error && (
                        <p className="notice error-notice" role="alert">
                            {error}
                        </p>
                    )}

                    {!loading && !error && posts.length === 0 && (
                        <div className="empty-state">
                            <span className="empty-mark" aria-hidden="true">↗</span>
                            <h3>A fresh starting line.</h3>
                            <p>No posts yet. Share your first running update.</p>
                        </div>
                    )}

                    {posts.map((post) => (
                        <article
                            className="post-card"
                            key={post.id}
                        >
                            <div className="post-card-inner">
                                <div className="post-header">
                                    <div className="post-author">
                                        <span className="author-avatar" aria-hidden="true">
                                            {post.author ? post.author[0] : 'R'}
                                        </span>

                                        <div className="author-details">
                                            <h3>{post.author || 'Runner'}</h3>

                                            <time className="post-date" dateTime={post.created_at}>
                                                {new Date(
                                                    post.created_at
                                                ).toLocaleDateString()}
                                            </time>
                                        </div>
                                    </div>

                                    <span
                                        className={
                                            post.visibility === 'friends-only'
                                                ? 'visibility-tag friends-tag'
                                                : 'visibility-tag'
                                        }
                                    >
                                        {post.visibility === 'friends-only'
                                            ? 'Friends-only'
                                            : 'Public'}
                                    </span>
                                </div>

                                <p className="post-content">
                                    {post.content}
                                </p>

                                {post.image_url && (
                                    <img
                                        className="post-image"
                                        src={post.image_url}
                                        alt="Photo attached to the running post"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
