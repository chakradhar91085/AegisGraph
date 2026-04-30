'use client'
import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import LineHoverLink from './LineHoverLink'
import { Shield } from 'lucide-react'

interface NavItem { label: string; onClick: () => void }

interface SpotlightNavbarProps {
  items: NavItem[]
  activeIndex: number
}

export default function SpotlightNavbar({ items, activeIndex }: SpotlightNavbarProps) {
  const navRef = useRef<HTMLDivElement>(null)
  const [hoverX, setHoverX] = useState<number | null>(null)
  const spotlightX = useRef(0)
  const ambienceX = useRef(0)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect()
      const x = e.clientX - rect.left
      setHoverX(x)
      spotlightX.current = x
      nav.style.setProperty('--spotlight-x', `${x}px`)
    }

    const handleLeave = () => {
      setHoverX(null)
      const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`)
      if (activeItem) {
        const navRect = nav.getBoundingClientRect()
        const itemRect = activeItem.getBoundingClientRect()
        const targetX = itemRect.left - navRect.left + itemRect.width / 2
        animate(spotlightX.current, targetX, {
          type: 'spring', stiffness: 200, damping: 20,
          onUpdate: v => { spotlightX.current = v; nav.style.setProperty('--spotlight-x', `${v}px`) }
        })
      }
    }

    nav.addEventListener('mousemove', handleMove)
    nav.addEventListener('mouseleave', handleLeave)
    return () => { nav.removeEventListener('mousemove', handleMove); nav.removeEventListener('mouseleave', handleLeave) }
  }, [activeIndex])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`)
    if (activeItem) {
      const navRect = nav.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()
      const targetX = itemRect.left - navRect.left + itemRect.width / 2
      animate(ambienceX.current, targetX, {
        type: 'spring', stiffness: 200, damping: 20,
        onUpdate: v => { ambienceX.current = v; nav.style.setProperty('--ambience-x', `${v}px`) }
      })
    }
  }, [activeIndex])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-3 flex items-center backdrop-blur-md bg-[#0a0a1a]/80 border-b border-white/5">
      {/* Logo — left */}
      <div className="flex items-center gap-2 text-white font-bold text-lg w-48 shrink-0">
        <Shield className="w-5 h-5 text-indigo-400" />
        <span className="tracking-tight">AegisGraph</span>
      </div>

      {/* Spotlight Nav — center */}
      <div className="flex-1 flex justify-center">
      <div
        ref={navRef}
        className="relative h-10 rounded-full flex items-center px-2 gap-0 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}
      >
        <ul className="relative flex items-center h-full gap-0 z-10">
          {items.map((item, idx) => (
            <li key={idx} className="relative h-full flex items-center">
              <button
                data-index={idx}
                onClick={item.onClick}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full focus:outline-none ${
                  activeIndex === idx ? 'text-white' : 'text-indigo-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Moving spotlight */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300"
          style={{
            opacity: hoverX !== null ? 1 : 0,
            background: `radial-gradient(100px circle at var(--spotlight-x, 50%) 100%, rgba(129,140,248,0.15) 0%, transparent 50%)`,
          }}
        />
        {/* Active ambience line */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-full h-[2px] z-[2]"
          style={{
            background: `radial-gradient(60px circle at var(--ambience-x, 50%) 0%, rgba(129,140,248,0.9) 0%, transparent 100%)`,
          }}
        />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5 z-0" />
      </div>
      </div>
      {/* Right spacer — mirrors logo width so nav stays centered */}
      <div className="w-48 shrink-0" />
    </header>
  )
}
