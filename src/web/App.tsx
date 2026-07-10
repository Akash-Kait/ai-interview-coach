import { useAppState } from './hooks/useAppState'
import Settings from './components/Settings'

export default function App() {
  const { state, dispatch } = useAppState()
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-xl font-semibold text-transparent">
          Runway
        </h1>
      </header>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Settings state={state} dispatch={dispatch} />
      </div>
    </main>
  )
}
