'use client'
import { useEffect, useRef } from 'react'

export default function LightLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const NUM_LINES = 12
    const balls = Array.from({ length: NUM_LINES }, (_, i) => ({
      x: (window.innerWidth / NUM_LINES) * i + window.innerWidth / NUM_LINES / 2,
      y: Math.random() * window.innerHeight,
      speed: 0.6 + Math.random() * 1.2,
      length: 80 + Math.random() * 120,
      opacity: 0.3 + Math.random() * 0.5,
    }))

    const isLight = () =>
      document.documentElement.getAttribute('data-theme') === 'light'

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const light = isLight()

      // Track lines
      balls.forEach(b => {
        ctx.beginPath()
        ctx.moveTo(b.x, 0)
        ctx.lineTo(b.x, canvas.height)
        ctx.strokeStyle = light
          ? 'rgba(99,102,241,0.07)'
          : 'rgba(99,102,241,0.06)'
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // Moving light balls
      balls.forEach(b => {
        const grad = ctx.createLinearGradient(b.x, b.y - b.length, b.x, b.y + b.length)
        if (light) {
          grad.addColorStop(0, 'transparent')
          grad.addColorStop(0.4, `rgba(99,102,241,${b.opacity * 0.25})`)
          grad.addColorStop(0.5, `rgba(79,70,229,${b.opacity * 0.55})`)
          grad.addColorStop(0.6, `rgba(99,102,241,${b.opacity * 0.25})`)
          grad.addColorStop(1, 'transparent')
        } else {
          grad.addColorStop(0, 'transparent')
          grad.addColorStop(0.4, `rgba(129,140,248,${b.opacity * 0.4})`)
          grad.addColorStop(0.5, `rgba(199,210,254,${b.opacity})`)
          grad.addColorStop(0.6, `rgba(129,140,248,${b.opacity * 0.4})`)
          grad.addColorStop(1, 'transparent')
        }

        ctx.beginPath()
        ctx.moveTo(b.x, b.y - b.length)
        ctx.lineTo(b.x, b.y + b.length)
        ctx.strokeStyle = grad
        ctx.lineWidth = light ? 1.2 : 1.5
        ctx.stroke()

        b.y += b.speed
        if (b.y - b.length > canvas.height) b.y = -b.length
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  )
}
