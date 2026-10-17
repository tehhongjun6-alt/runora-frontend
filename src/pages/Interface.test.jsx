import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../App'
import Login from './Login'
import Signup from './Signup'
import Feed from './Feed'
import Profile from './Profile'

// Only replace external authentication and network calls, not the UI.
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
    },
  },
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('login prevents another submission while the first request is pending', async () => {
  vi.stubGlobal('fetch', () => new Promise(() => {}))
  render(<Login onLogin={() => {}} />)
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'runner@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'test-password' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Log in', exact: true }))
  expect(screen.getByRole('button', { name: 'Logging in...' }).disabled).toBe(true)
})

test('signup prevents another submission while account creation is pending', () => {
  vi.stubGlobal('fetch', () => new Promise(() => {}))
  render(<Signup />)
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'runner@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'test-password' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Sign up', exact: true }))
  expect(screen.getByRole('button', { name: 'Creating account...' }).disabled).toBe(true)
})

test('navigation exposes the current page and keeps signup and login reachable', async () => {
  render(<App />)
  const nav = await screen.findByRole('navigation', { name: 'Main navigation' })
  expect(within(nav).getByRole('button', { name: 'Log in' }).getAttribute('aria-current')).toBe('page')
  fireEvent.click(within(nav).getByRole('button', { name: 'Sign up' }))
  expect(screen.getByLabelText('Email').id).toBe('signup-email')
  expect(within(nav).getByRole('button', { name: 'Sign up' }).getAttribute('aria-current')).toBe('page')
  fireEvent.click(within(nav).getByRole('button', { name: 'Log in' }))
  expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy()
})

test('feed announces loading, preserves post content, and exposes friends-only visibility', async () => {
  let finishLoading
  vi.stubGlobal('fetch', () => new Promise((resolve) => { finishLoading = resolve }))
  render(<Feed token="test-token" />)
  expect(screen.getByRole('status').textContent).toContain('Loading posts')
  finishLoading({
    ok: true,
    status: 200,
    json: async () => [{
      id: 7,
      author: 'Morning Runner',
      content: 'A quiet 5 km before sunrise.',
      visibility: 'friends-only',
      created_at: '2026-10-17T06:00:00Z',
      image_url: '/logo.png',
    }],
  })
  expect(await screen.findByText('A quiet 5 km before sunrise.')).toBeTruthy()
  const post = screen.getByRole('article')
  expect(within(post).getByText('Morning Runner')).toBeTruthy()
  expect(within(post).getByText('Friends-only')).toBeTruthy()
  expect(within(post).getByRole('img').getAttribute('src')).toBe('/logo.png')
  fireEvent.change(screen.getByLabelText('Visibility'), { target: { value: 'friends-only' } })
  expect(screen.getByLabelText('Visibility').value).toBe('friends-only')
})

test('profile load errors are announced and do not display a false identity', async () => {
  vi.stubGlobal('fetch', async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
  }))
  render(<Profile token="expired-token" />)
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Please log out and log in again'))
  expect(screen.queryByText('User ID')).toBeNull()
})

test('profile keeps the exact email and UUID returned by the API', async () => {
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      email: 'runner@example.com',
      userId: '40d21d50-397e-4dc5-a6c7-cc9ef598ff36',
    }),
  }))
  render(<Profile token="test-token" />)
  expect(await screen.findByText('runner@example.com')).toBeTruthy()
  expect(screen.getByText('40d21d50-397e-4dc5-a6c7-cc9ef598ff36')).toBeTruthy()
})

test('a feed failure shows an error rather than claiming the feed is empty', async () => {
  vi.stubGlobal('fetch', async () => { throw new Error('Failed to fetch') })
  render(<Feed token="test-token" />)
  expect((await screen.findByRole('alert')).textContent).toContain('Failed to fetch')
  expect(screen.queryByText('No posts yet. Share your first running update.')).toBeNull()
})

test('choosing and removing a photo restores the original file picker', async () => {
  vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => [] }))
  render(<Feed token="test-token" />)
  const picker = screen.getByLabelText('Add a photo', { exact: false })
  fireEvent.change(picker, { target: { files: [new File(['image'], 'morning-run.png', { type: 'image/png' })] } })
  expect(screen.getByText('morning-run.png')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Remove image' }))
  expect(screen.getByLabelText('Add a photo', { exact: false }).type).toBe('file')
  await screen.findByText('No posts yet. Share your first running update.')
})

test('publishing keeps the token and friends-only payload and clears the form after success', async () => {
  const requests = []
  vi.stubGlobal('fetch', async (url, options) => {
    requests.push({ url, options })
    return {
      ok: true,
      status: options?.method === 'POST' ? 201 : 200,
      json: async () => options?.method === 'POST' ? { id: 8 } : [],
    }
  })
  render(<Feed token="test-token" />)
  await screen.findByText('No posts yet. Share your first running update.')
  fireEvent.change(screen.getByLabelText('Your update'), { target: { value: '  A sunset run.  ' } })
  fireEvent.change(screen.getByLabelText('Visibility'), { target: { value: 'friends-only' } })
  fireEvent.click(screen.getByRole('button', { name: 'Publish post' }))
  expect(await screen.findByText('Post published successfully')).toBeTruthy()
  const savedRequest = requests.find((request) => request.options?.method === 'POST')
  expect(savedRequest.options.headers.Authorization).toBe('Bearer test-token')
  expect(JSON.parse(savedRequest.options.body)).toEqual({
    content: 'A sunset run.',
    visibility: 'friends-only',
    image_url: null,
  })
  expect(screen.getByLabelText('Your update').value).toBe('')
  expect(screen.getByLabelText('Visibility').value).toBe('public')
})
