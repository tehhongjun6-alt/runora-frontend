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
                        disabled={submitting}
                        onChange={(event) => setContent(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="post-visibility">Who can see this?</label>
                    <select
                        id="post-visibility"
                        value={visibility}
                        disabled={submitting}
                        onChange={(event) => setVisibility(event.target.value)}
                    >
                        <option value="public">Public</option>
                        <option value="friends-only">Friends-only</option>
                    </select>
                </div>

                <div>
                    <p>Running photo — optional</p>
                    <p>JPG, PNG or WebP. Maximum 2 MB.</p>

                    {file ? (
                        <div>
                            <p>Selected: {file.name}</p>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setFile(null)}
                            >
                                Remove image
                            </button>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="post-image">Choose an image</label>
                            <input
                                id="post-image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={submitting}
                                onChange={(event) =>
                                    setFile(event.target.files[0] || null)
                                }
                            />
                        </div>
                    )}
                </div>

                <button type="submit" disabled={submitting}>
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

                    {/* 有图片地址才显示图片，旧文字帖子仍然正常显示 */}
                    {post.image_url && (
                        <img
                            src={post.image_url}
                            alt="Photo attached to the running post"
                            style={{ maxWidth: '100%', height: 'auto' }}
                        />
                    )}

                    <p>Posted: {post.created_at}</p>
                    <hr />
                </div>
            ))}
        </section>
    )
}