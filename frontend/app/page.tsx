'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import LightLines from '@/components/LightLines'
import RevealLoader from '@/components/RevealLoader'
import SpotlightNavbar from '@/components/SpotlightNavbar'
import FlipText from '@/components/FlipText'
import FlipFadeText from '@/components/FlipFadeText'
import AnimatedButton from '@/components/AnimatedButton'
import ThemeToggle from '@/components/ThemeToggle'
import { Query, Logs, Profile } from '@/lib/api'
import { signOutUser } from '@/lib/firebaseAuth'
import { LogOut, Terminal, BarChart2, GitBranch, User, CheckCircle, ShieldAlert } from 'lucide-react'

type Tab = 'query' | 'logs' | 'profile'

interface QueryResult {
  output: string
  risk_score: number
  risk_level: string
  response_mode: string
  entities: string[]
  behavior_signals: Record<string, any>
}

const RISK_COLOR: Record<string, string> = {
  LOW: 'text-emerald-400', MEDIUM: 'text-amber-400', HIGH: 'text-red-400',
}
const RISK_BG: Record<string, string> = {
  LOW: 'bg-emerald-400/10 border-emerald-400/30',
  MEDIUM: 'bg-amber-400/10 border-amber-400/30',
  HIGH: 'bg-red-400/10 border-red-400/30',
}

export default function Home() {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [user, setUser] = useState<{ username: string; role: string; uid: string } | null>(null)
  const [tab, setTab] = useState<Tab>('query')
  const [query, setQuery] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [queryError, setQueryError] = useState('')
  const [logs, setLogs] = useState<any[]>([])
  const [profile, setProfileData] = useState<any>(null)

  // Restore Firebase session from sessionStorage (set by /login page)
  useEffect(() => {
    const uid = sessionStorage.getItem('aegis_uid')
    const username = sessionStorage.getItem('aegis_username')
    const role = sessionStorage.getItem('aegis_role')
    if (uid && username && role) {
      setUser({ uid, username, role })
    } else {
      router.replace('/login')
    }
  }, [router])

  const navItems = [
    { label: 'Query', onClick: () => setTab('query') },
    { label: 'Logs', onClick: () => { setTab('logs'); fetchLogs() } },
    { label: 'Profile', onClick: () => { setTab('profile'); fetchProfile() } },
  ]
  const tabIndex = tab === 'query' ? 0 : tab === 'logs' ? 1 : 2

  const fetchLogs = useCallback(async () => {
    if (!user) return
    try { const d = await Logs.get(user.uid); setLogs(d.logs) } catch {}
  }, [user])

  const fetchProfile = useCallback(async () => {
    if (!user) return
    try { const d = await Profile.get(user.uid); setProfileData(d.profile) } catch {}
  }, [user])

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !query.trim()) return
    setProcessing(true); setResult(null); setQueryError('')
    try {
      const data = await Query.run(query, user.uid, user.role)
      setResult(data)
    } catch (err: any) {
      setQueryError(err.message)
    } finally { setProcessing(false) }
  }

  const handleLogout = async () => {
    await signOutUser()
    sessionStorage.clear()
    router.replace('/login')
  }

  if (!user) return null

  return (
    <>
      <RevealLoader onComplete={() => setLoaded(true)} />
      <LightLines />

      <AnimatePresence>
        {loaded && (
          <motion.div
            className="relative z-10 min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="min-h-screen pt-20">
              <SpotlightNavbar items={navItems} activeIndex={tabIndex} />

              {/* User badge + theme toggle + logout */}
              <div className="fixed top-0 right-6 z-50 h-[52px] flex items-center gap-3">
                <ThemeToggle />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-indigo-300">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium text-white">{user.username}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-600/40 text-indigo-200 font-semibold">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/50 hover:text-red-400 hover:bg-red-400/10 border border-white/10 hover:border-red-400/30 transition-all duration-200"
                >
                  <LogOut className="w-3.5 h-3.5" />Logout
                </button>
              </div>

              <div className="max-w-5xl mx-auto px-8 py-10">
                {/* ── QUERY TAB ── */}
                {tab === 'query' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="mb-8">
                      <FlipText className="text-3xl font-black text-white" delay={0}>
                        Dynamic Query Playground
                      </FlipText>
                      <p className="text-indigo-400 mt-2 text-sm">
                        Probe the knowledge graph. Repeated probing triggers escalating risk rules.
                      </p>
                    </div>

                    <form onSubmit={handleQuery} className="mb-6">
                      <div className="flex gap-3">
                        <input
                          className="flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                          style={{
                            background: 'var(--input-bg)',
                            borderColor: 'var(--input-border)',
                            color: 'var(--text-primary)',
                          }}
                          placeholder='e.g. "Who manages Alice?" or "What is Project_Titan?"'
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          disabled={processing}
                        />
                        <AnimatedButton type="submit" disabled={processing || !query.trim()}>
                          <Terminal className="w-4 h-4 inline mr-2" />
                          {processing ? 'Running…' : 'Execute'}
                        </AnimatedButton>
                      </div>
                    </form>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {['Who manages Alice?', 'What classification does Project_Titan have?', 'Show deep graph for Alice', 'Alice Bob'].map(s => (
                        <button key={s} onClick={() => setQuery(s)}
                          className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-indigo-300 hover:bg-white/10 hover:text-white transition-all">
                          {s}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence>
                      {processing && (
                        <motion.div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 mb-6"
                          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                          <FlipFadeText />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {queryError && (
                      <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 mb-6 text-red-400 text-sm">{queryError}</div>
                    )}

                    <AnimatePresence>
                      {result && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                          <div className="grid grid-cols-3 gap-5">
                            {[
                              { label: 'Risk Score', value: result.risk_score, icon: <BarChart2 className="w-5 h-5" /> },
                              { label: 'Risk Level', value: result.risk_level, icon: <ShieldAlert className="w-5 h-5" />, color: RISK_COLOR[result.risk_level] },
                              { label: 'Response Mode', value: result.response_mode, icon: <GitBranch className="w-5 h-5" /> },
                            ].map(m => (
                              <div key={m.label} className={`rounded-2xl border p-6 flex flex-col gap-3 ${RISK_BG[result.risk_level]}`}>
                                <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest">
                                  {m.icon}<span>{m.label}</span>
                                </div>
                                <p className={`text-3xl font-black tracking-tight ${m.color || 'text-white'}`}>{m.value}</p>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                            <p className="text-xs text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5" /> Response
                            </p>
                            <div className="space-y-2">
                              {result.output.split('\n').filter(Boolean).map((line, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] transition-colors border border-white/5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 shrink-0" />
                                  <span className="text-sm text-white/80 font-mono">{line.replace(/^- /, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <details className="rounded-xl border border-white/10 bg-white/[0.02]">
                            <summary className="px-5 py-3 text-xs text-white/40 cursor-pointer hover:text-white/60 transition-colors uppercase tracking-wider">
                              Debug Metadata
                            </summary>
                            <div className="px-5 pb-5 space-y-2">
                              <p className="text-xs text-indigo-300">Entities: <span className="text-white">{result.entities.join(', ') || 'none'}</span></p>
                              {Object.entries(result.behavior_signals).map(([k, v]) => (
                                <p key={k} className="text-xs text-indigo-300">{k}: <span className="text-white">{String(v)}</span></p>
                              ))}
                            </div>
                          </details>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ── LOGS TAB ── */}
                {tab === 'logs' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-2xl font-bold mb-6">Query Logs</h2>
                    {logs.length === 0 ? (
                      <p className="text-white/40 text-sm">No logs yet. Run a query first.</p>
                    ) : (
                      <div className="space-y-3">
                        {logs.map((log, i) => (
                          <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-sm text-white font-mono">&quot;{log.raw_query}&quot;</p>
                              <span className={`text-xs font-bold shrink-0 ${RISK_COLOR[log.risk_level] || 'text-white'}`}>{log.risk_level}</span>
                            </div>
                            <div className="flex gap-4 mt-2 text-xs text-white/40">
                              <span>Score: {log.risk_score}</span>
                              <span>{log.response_mode}</span>
                              <span>{log.timestamp} IST</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── PROFILE TAB ── */}
                {tab === 'profile' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-2xl font-bold mb-6">User Profile</h2>
                    {!profile ? (
                      <p className="text-white/40 text-sm">No profile data yet. Run a query first.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Total Queries', value: profile.total_queries },
                          { label: 'Avg Risk Score', value: profile.avg_risk?.toFixed(2) },
                          { label: 'Suspicious Queries', value: profile.suspicious_count },
                          { label: 'Last Seen', value: profile.last_seen ? `${profile.last_seen} IST` : null },
                        ].map(item => (
                          <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                            <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-2xl font-bold text-white">{item.value ?? '—'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
