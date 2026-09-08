import { useEffect, useRef } from 'react'

// FPS readout for the show_fps setting (Tech.md §2 planned this file). Counts
// frames on its own rAF and writes textContent at ~10Hz — it never re-renders,
// per Tech.md §5.4.
export default function Stats() {
  const ref = useRef(null)

  useEffect(() => {
    let frames = 0
    let last = performance.now()
    let raf = 0

    const loop = () => {
      frames += 1
      const now = performance.now()
      if (now - last >= 100) {
        const el = ref.current
        if (el) el.textContent = `${Math.round((frames * 1000) / (now - last))} fps`
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <span ref={ref}>-- fps</span>
}
