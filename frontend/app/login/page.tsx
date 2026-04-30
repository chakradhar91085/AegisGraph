'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import AuthCard from '@/components/AuthCard'
import LoginConfirm from '@/components/LoginConfirm'

export default function LoginPage() {
  const [confirming, setConfirming] = useState(false)
  const [confirmedUser, setConfirmedUser] = useState({ name: '', uid: '', role: '' })
  const router = useRouter()

  const handleSuccess = (username: string, uid: string, role: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aegis_uid', uid)
      sessionStorage.setItem('aegis_username', username)
      sessionStorage.setItem('aegis_role', role)
    }
    setConfirmedUser({ name: username, uid, role })
    setConfirming(true)
  }

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50% }
          50%  { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        .neon-gradient {
          background: linear-gradient(135deg, #1a0533, #4c1d95, #1e1b4b, #be185d, #1d4ed8, #0f172a, #6b21a8);
          background-size: 400% 400%;
          animation: gradientShift 10s ease infinite;
        }
      `}</style>

      {/* Truly full-screen — no rounding, no padding, no margin */}
      <div className="h-screen w-screen flex overflow-hidden bg-[#09090f]">
        <motion.div
          className="flex w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── LEFT PANEL ── */}
          <div className="relative hidden md:flex md:w-[44%] flex-col overflow-hidden">
            <div className="absolute inset-0 neon-gradient" />
            <div className="absolute inset-0 bg-black/35" />

            {/* Top logo */}
            <div className="relative z-10 p-10 flex items-center gap-2.5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="10" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.1)"/>
                <rect x="16" y="2" width="10" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.1)"/>
                <rect x="2" y="16" width="10" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.1)"/>
                <rect x="16" y="16" width="10" height="10" rx="2" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="rgba(255,255,255,0.05)"/>
                <line x1="7" y1="12" x2="7" y2="16" stroke="white" strokeWidth="1.5"/>
                <line x1="21" y1="12" x2="21" y2="16" stroke="white" strokeWidth="1.5"/>
                <line x1="12" y1="7" x2="16" y2="7" stroke="white" strokeWidth="1.5"/>
                <line x1="12" y1="21" x2="16" y2="21" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
              </svg>
              <span className="text-white font-semibold text-[15px] tracking-tight">AegisGraph</span>
            </div>

            {/* Bottom branding text */}
            <motion.div
              className="relative z-10 mt-auto p-10 pb-16"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2
                className="text-[46px] font-black text-white leading-[1.1] mb-5"
                style={{ fontFamily: 'Anton, Inter, system-ui, sans-serif' }}
              >
                Privacy-Aware<br />Graph Intelligence
              </h2>
              <p className="text-white/65 text-[13px] leading-relaxed max-w-[280px]">
                Built to detect probing behavior, control access,<br />
                and secure enterprise knowledge system.
              </p>
            </motion.div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <motion.div
            className="flex-1 bg-white flex flex-col overflow-y-auto"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <AuthCard onSuccess={handleSuccess} />
          </motion.div>
        </motion.div>
      </div>

      {confirming && (
        <LoginConfirm
          username={confirmedUser.name}
          onDone={() => router.push('/')}
        />
      )}
    </>
  )
}
