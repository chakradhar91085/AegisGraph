'use client'
import { useEffect, useState, useMemo, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const WORDS = ['ANALYZING', 'COMPUTING', 'RETRIEVING', 'TRAVERSING', 'EVALUATING']

const Letter = memo(function Letter({ char }: { char: string }) {
  return (
    <motion.span
      style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
      variants={{
        initial: { rotateX: 90, y: 20, opacity: 0, filter: 'blur(8px)' },
        animate: { rotateX: 0, y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] } },
        exit:    { rotateX: -90, y: -20, opacity: 0, filter: 'blur(8px)', transition: { duration: 0.3, ease: 'easeIn' } },
      }}
    >
      {char}
    </motion.span>
  )
})

const Word = memo(function Word({ text }: { text: string }) {
  return (
    <motion.div
      className="flex gap-[0.08em] text-2xl font-bold text-indigo-300 tracking-widest uppercase"
      initial="initial" animate="animate" exit="exit"
      variants={{ initial: { opacity: 1 }, animate: { opacity: 1, transition: { staggerChildren: 0.06 } }, exit: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
    >
      {text.split('').map((c, i) => <Letter key={`${c}-${i}`} char={c} />)}
    </motion.div>
  )
})

export default function FlipFadeText() {
  const [index, setIndex] = useState(0)
  const next = useCallback(() => setIndex(p => (p + 1) % WORDS.length), [])
  useEffect(() => { const t = setInterval(next, 1800); return () => clearInterval(t) }, [next])
  const word = useMemo(() => WORDS[index], [index])

  return (
    <div className="flex items-center justify-center py-6" style={{ perspective: '800px' }}>
      <AnimatePresence mode="wait">
        <Word key={word} text={word} />
      </AnimatePresence>
    </div>
  )
}
