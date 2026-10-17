import { test, expect } from 'vitest'
import dotenv from 'dotenv'
import { ENDPOINTS } from '../api'

dotenv.config()

test('creates a friends-only post with a valid access token', async () => {
    const email = process.env.TEST_LOGIN_EMAIL
    const password = process.env.TEST_LOGIN_PASSWORD

    if (!email || !password) {
        throw new Error('Set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD in .env')
    }

    // Log in with the fixed test account to obtain an access token
    const loginResponse = await fetch(ENDPOINTS.login, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            password,
        }),
    })

    expect(loginResponse.status).toBe(200)

    const loginData = await loginResponse.json()
    const token = loginData.session.access_token

    expect(token).toBeTruthy()

    const content = 'Automated test: finished a 5 km morning run.'

    // Create a real post using the authenticated account
    const response = await fetch(ENDPOINTS.posts, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            content,
            visibility: 'friends-only',
        }),
    })

    const post = await response.json()

    // Check the saved post, its visibility, and its author
    expect(response.status).toBe(201)
    expect(post.id).toBeTruthy()
    expect(post.content).toBe(content)
    expect(post.visibility).toBe('friends-only')
    expect(post.author_id).toBe(loginData.session.user.id)
})