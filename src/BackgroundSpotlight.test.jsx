import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

let media
let frames
let mediaChanged

beforeEach(() => {
  frames = new Map()
  media = {
    matches: true,
    addEventListener: (name, callback) => { mediaChanged = callback },
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('matchMedia', () => media)
  let id = 0
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
    frames.set(++id, callback)
    return id
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((frame) => frames.delete(frame)))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function movePointer(x, y, pointerType = 'mouse') {
  const event = new MouseEvent('pointermove', { clientX: x, clientY: y })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  fireEvent(window, event)
}

function paintFrame() {
  const pending = [...frames.values()]
  frames.clear()
  pending.forEach((callback) => callback(16))
}

async function showPage() {
  const view = render(<App />)
  await screen.findByRole('navigation', { name: 'Main navigation' })
  const layer = view.container.querySelector('.background-spotlight')
  expect(layer, 'The decorative background layer must exist').not.toBeNull()
  return { ...view, layer }
}

test('coalesces rapid mouse movements into one frame at the latest position', async () => {
  const { layer } = await showPage()
  movePointer(300, 320)
  movePointer(420, 340)
  expect(frames.size).toBe(1)
  paintFrame()
  expect(layer.style.transform).toBe('translate3d(140px, 60px, 0)')
  expect(layer.firstElementChild.style.transform).toBe('translate3d(-140px, -60px, 0)')
  expect(layer.style.opacity).toBe('1')
  expect(frames.size).toBe(0)
})

test('leaving the page fades the light and cancels a queued frame', async () => {
  const { layer } = await showPage()
  movePointer(420, 340)
  paintFrame()
  movePointer(500, 400)
  fireEvent(document, new Event('pointerleave'))
  expect(layer.style.opacity).toBe('0')
  expect(frames.size).toBe(0)
  paintFrame()
  expect(layer.style.opacity).toBe('0')
})

test('does not animate when the device or reduced-motion preference disables it', async () => {
  media.matches = false
  const { layer } = await showPage()
  movePointer(420, 340)
  expect(frames.size).toBe(0)
  expect(layer.style.opacity).toBe('0')
})

test('turning reduced motion on hides the light and turning it off permits movement again', async () => {
  const { layer } = await showPage()
  movePointer(420, 340)
  paintFrame()
  media.matches = false
  mediaChanged()
  expect(layer.style.opacity).toBe('0')
  movePointer(500, 400)
  expect(frames.size).toBe(0)
  media.matches = true
  mediaChanged()
  movePointer(500, 400)
  paintFrame()
  expect(layer.style.opacity).toBe('1')
})

test('touch input and window blur hide the light instead of leaving a bright spot', async () => {
  const { layer } = await showPage()
  movePointer(420, 340)
  paintFrame()
  movePointer(420, 340, 'touch')
  expect(layer.style.opacity).toBe('0')
  movePointer(420, 340)
  paintFrame()
  fireEvent(window, new Event('blur'))
  expect(layer.style.opacity).toBe('0')
})

test('unmounting removes listeners and cancels pending animation', async () => {
  const { unmount } = await showPage()
  movePointer(420, 340)
  expect(frames.size).toBe(1)
  unmount()
  expect(frames.size).toBe(0)
  movePointer(500, 400)
  expect(frames.size).toBe(0)
  expect(media.removeEventListener).toHaveBeenCalled()
})

test('pointer exit hides the light only when it leaves the whole document', async () => {
  const { layer } = await showPage()
  movePointer(420, 340)
  paintFrame()
  fireEvent(window, new MouseEvent('pointerout', { relatedTarget: document.body }))
  expect(layer.style.opacity).toBe('1')
  fireEvent(window, new MouseEvent('pointerout', { relatedTarget: null }))
  expect(layer.style.opacity).toBe('0')
})

test('background stays aligned when page content adds or removes a scrollbar', async () => {
  let notifySizeChange = () => {}
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { notifySizeChange = callback }
    observe() {}
    disconnect() {}
  })
  const width = vi.spyOn(document.documentElement, 'clientWidth', 'get')
  width.mockReturnValue(1280)
  const { layer } = await showPage()
  expect(layer.firstElementChild.style.width).toBe('1280px')
  width.mockReturnValue(1265)
  notifySizeChange()
  expect(layer.firstElementChild.style.width).toBe('1265px')
})
