'use client'
import { motion } from 'framer-motion'

interface FlipTextProps {
  children: string
  className?: string
  delay?: number
}

export default function FlipText({ children, className = '', delay = 0 }: FlipTextProps) {
  return (
    <span className={className} aria-label={children} style={{ display: 'inline-flex', gap: '0.04em', perspective: '600px' }}>
      {children.split('').map((char, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
          initial={{ rotateX: 90, opacity: 0, filter: 'blur(6px)' }}
          animate={{ rotateX: 0, opacity: 1, filter: 'blur(0px)' }}
          transition={{
            duration: 0.55,
            delay: delay + i * 0.04,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}
