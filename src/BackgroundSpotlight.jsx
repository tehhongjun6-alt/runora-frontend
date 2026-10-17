import { useEffect, useRef } from 'react'

// This decoration never changes React state, reads account data, or handles clicks.
export default function BackgroundSpotlight() {
  const lightRef = useRef(null)
  const imageRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia) return

    const light = lightRef.current
    const image = imageRef.current
    const media = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (min-width: 761px) and (prefers-reduced-motion: no-preference)'
    )
    let enabled = media.matches
    let frame = 0
    let x = 0
    let y = 0

    function hide() {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      light.style.opacity = '0'
    }

    function resize() {
      hide()
      // Read viewport dimensions on resize, never on each mouse movement.
      image.style.width = `${document.documentElement.clientWidth}px`
      image.style.height = `${window.innerHeight}px`
    }

    function updatePreference() {
      enabled = media.matches
      if (!enabled) hide()
    }

    function leaveWindow(event) {
      if (!event.relatedTarget) hide()
    }

    function move(event) {
      if (!enabled || event.pointerType !== 'mouse') {
        hide()
        return
      }
      x = event.clientX - 280
      y = event.clientY - 280
      if (frame) return

      // Coalesce events into one paint; do not run a continuous animation loop.
      frame = requestAnimationFrame(() => {
        frame = 0
        light.style.transform = `translate3d(${x}px, ${y}px, 0)`
        // Counter-movement keeps the original background image perfectly still.
        image.style.transform = `translate3d(${-x}px, ${-y}px, 0)`
        light.style.opacity = '1'
      })
    }

    resize()
    // Page changes can add a scrollbar without firing a window resize event.
    const sizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(resize)
    sizeObserver?.observe(document.documentElement)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('resize', resize)
    window.addEventListener('blur', hide)
    window.addEventListener('pointerout', leaveWindow)
    document.addEventListener('pointerleave', hide)
    document.addEventListener('visibilitychange', hide)
    media.addEventListener('change', updatePreference)

    return () => {
      hide()
      sizeObserver?.disconnect()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('resize', resize)
      window.removeEventListener('blur', hide)
      window.removeEventListener('pointerout', leaveWindow)
      document.removeEventListener('pointerleave', hide)
      document.removeEventListener('visibilitychange', hide)
      media.removeEventListener('change', updatePreference)
    }
  }, [])

  return (
    <div className="background-spotlight" ref={lightRef} aria-hidden="true">
      <div className="background-spotlight-image" ref={imageRef} />
    </div>
  )
}
