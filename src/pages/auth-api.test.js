import { test, expect } from 'vitest'
import dotenv from 'dotenv'
import { ENDPOINTS } from '../api'

// Read private test credentials from the local .env file
dotenv.config()

test('logs in with a fixed account and returns an access token', async () => {
    const email = process.env.TEST_LOGIN_EMAIL
    const password = process.env.TEST_LOGIN_PASSWORD

    if (!email || !password) {
        throw new Error('Set TEST_LOGIN_EMAIL and TEST_LOGIN_PASSWORD in .env')
    }

    // Send the real account details to the backend
    const response = await fetch(ENDPOINTS.login, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            password,
        }),
    })

    const data = await response.json()

    // Check that login succeeded and belongs to the expected account
    expect(response.status).toBe(200)
    expect(data.session.access_token).toBeTruthy()
    expect(data.session.user.email).toBe(email)
})