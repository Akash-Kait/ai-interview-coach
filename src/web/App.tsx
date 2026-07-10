import { useEffect, useState } from 'react'
import { SEED_COMPANIES, overallScore } from '../core'
import { useAppState } from './hooks/useAppState'
import Dashboard from './components/Dashboard'
import DsaLog from './components/DsaLog'
import SkillQuiz from './components/SkillQuiz'
import DesignCoach from './components/DesignCoach'
import ActivityGraph from './components/ActivityGraph'
import Settings from './components/Settings'

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'dsa', label: 'DSA' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'design', label: 'Design' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
] as const
type View = (typeof NAV)[number]['id']

export default function App() {
  const { state, dispatch } = useAppState()
  const [view, setView] = useState<View>('dashboard')
  const company = SEED_COMPANIES.find((c) => c.id === state.companyId) ?? SEED_COMPANIES[0]
  const overall = Math.round(overallScore(state, company))

  // Snapshot overall readiness (deduped per day) so pacing has a history to read.
  useEffect(() => {
    dispatch({ type: 'recordReadiness', at: Date.now(), value: overall })
  }, [dispatch, overall])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-800 px-6 py-4">
        <h1 className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-xl font-semibold text-transparent">
          Runway
        </h1>
        <nav className="flex flex-wrap gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setView(n.id)}
              aria-current={view === n.id ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                view === n.id ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-2xl px-6 py-8">
        {view === 'dashboard' && <Dashboard state={state} company={company} dispatch={dispatch} />}
        {view === 'dsa' && <DsaLog state={state} dispatch={dispatch} />}
        {view === 'quiz' && <SkillQuiz state={state} dispatch={dispatch} />}
        {view === 'design' && <DesignCoach state={state} dispatch={dispatch} />}
        {view === 'activity' && <ActivityGraph state={state} />}
        {view === 'settings' && <Settings state={state} dispatch={dispatch} />}
      </div>
    </main>
  )
}
