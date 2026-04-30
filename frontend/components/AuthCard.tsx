'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import {
  signInWithEmail, signUpWithEmail, signInWithGoogle,
  sendPasswordReset, getUsername, getUserRole, parseFirebaseError
} from '@/lib/firebaseAuth'
import { auth } from '@/lib/firebase'

type Mode = 'login' | 'signup' | 'forgot'
interface Props { onSuccess: (username: string, uid: string, role: string) => void }

export default function AuthCard({ onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('Employee')
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const reset = () => { setError(''); setMessage('') }
  const go = (m: Mode) => { setMode(m); reset() }

  // Safely fetch username — falls back to displayName or email prefix
  const safeGetUsername = async (uid: string): Promise<string> => {
    try {
      return await getUsername(uid)
    } catch {
      return auth.currentUser?.displayName
        || auth.currentUser?.email?.split('@')[0]
        || 'User'
    }
  }

  // Safely fetch role — falls back to default 'Employee'
  const safeGetRole = async (uid: string): Promise<string> => {
    try {
      return await getUserRole(uid)
    } catch {
      return 'Employee'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true)
    try {
      if (mode === 'forgot') {
        await sendPasswordReset(email)
        setMessage('Reset email sent! Check your inbox.')
        setLoading(false)
        return
      }

      if (mode === 'signup') {
        const user = await signUpWithEmail(email, password, username, role)
        setLoading(false)
        onSuccess(username || user.email?.split('@')[0] || 'User', user.uid, role)
        return
      }

      // Login
      const user = await signInWithEmail(email, password)
      const [name, r] = await Promise.all([
        safeGetUsername(user.uid),
        safeGetRole(user.uid),
      ])
      setLoading(false)
      onSuccess(name, user.uid, r)

    } catch (err: any) {
      setError(parseFirebaseError(err.code || err.message || ''))
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    reset(); setLoading(true)
    try {
      const user = await signInWithGoogle()
      const [name, r] = await Promise.all([
        safeGetUsername(user.uid),
        safeGetRole(user.uid),
      ])
      setLoading(false)
      onSuccess(name, user.uid, r)
    } catch (err: any) {
      setError(parseFirebaseError(err.code || err.message || ''))
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 md:px-14 py-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7v5c0 5.25 4.25 10.15 10 11.35C17.75 22.15 22 17.25 22 12V7L12 2z"
            stroke="#4f46e5" strokeWidth="1.8" fill="rgba(79,70,229,0.1)" strokeLinejoin="round"/>
          <path d="M9 12l2 2 4-4" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-gray-900 font-bold text-[15px] tracking-tight">AegisGraph</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className="w-full max-w-[360px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          <h1 className="text-[30px] font-bold text-gray-900 mb-1 leading-tight">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p className="text-gray-400 text-sm mb-8 leading-snug">
            {mode === 'login'
              ? 'Enter your email and password to access your account'
              : mode === 'signup'
              ? 'Fill in the details below to get started'
              : 'Enter your email to receive a password reset link'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username — signup only */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Choose a username" required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={mode === 'login' ? 'Email or username' : 'Enter your email'}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password" required
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Role — signup only */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white">
                  <option value="Employee">Employee</option>
                  <option value="External">External</option>
                </select>
              </div>
            )}

            {/* Remember + Forgot */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0" />
                  <span className="text-sm text-gray-500">Remember me</span>
                </label>
                <button type="button" onClick={() => go('forgot')}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Feedback messages */}
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</motion.p>
              )}
              {message && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-emerald-600 text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{message}</motion.p>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3.5 rounded-xl bg-gray-950 text-white font-semibold text-sm hover:bg-black transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round"/>
                  </svg>
                  Please wait…
                </span>
              ) : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
            </motion.button>
          </form>

          {/* Google — login/signup only */}
          {mode !== 'forgot' && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <motion.button onClick={handleGoogle} disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all disabled:opacity-50">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Sign in with Google
              </motion.button>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-gray-400 mt-7">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => go('signup')} className="text-indigo-600 font-semibold hover:underline">Sign Up</button>
              </>
            ) : (
              <button onClick={() => go('login')} className="text-indigo-600 font-semibold hover:underline">← Back to Login</button>
            )}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
