'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RevealLoaderProps {
  onComplete?: () => void
}

export default function RevealLoader({ onComplete }: RevealLoaderProps) {
  const [show, setShow] = useState(true)
  const [exit, setExit] = useState(false)
  const text = 'AEGISGRAPH'

  useEffect(() => {
    const already = sessionStorage.getItem('aegis_loaded')
    if (already) { setShow(false); onComplete?.(); return }

    const t1 = setTimeout(() => setExit(true), 2400)
    const t2 = setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('aegis_loaded', '1')
      onComplete?.()
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete])

  if (!show) return null

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a1a]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Gradient shutter bars */}
          <div className="absolute inset-0 grid grid-rows-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-full"
                style={{ background: i % 2 === 0 ? '#0f172a' : '#1e293b' }}
                initial={{ scaleY: 1 }}
                animate={{ scaleY: exit ? 0 : 1 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              />
            ))}
          </div>

          {/* Text */}
          <div className="relative z-10 flex gap-[0.05em]" style={{ perspective: '600px' }}>
            {text.split('').map((char, i) => (
              <motion.span
                key={i}
                className="text-6xl md:text-8xl font-black text-white tracking-widest"
                style={{ display: 'inline-block', fontFamily: 'Anton, sans-serif', transformStyle: 'preserve-3d' }}
                initial={{ rotateX: 90, y: 30, opacity: 0, filter: 'blur(8px)' }}
                animate={{ rotateX: 0, y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.07, ease: [0.2, 0.65, 0.3, 0.9] }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            className="absolute bottom-[38%] text-indigo-400 text-sm tracking-[0.3em] uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            Privacy-Aware Security Framework
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
