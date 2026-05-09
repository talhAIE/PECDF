import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import MacroBar from './MacroBar'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <MacroBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
