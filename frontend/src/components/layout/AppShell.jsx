import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import MacroBar from './MacroBar'

export default function AppShell() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <MacroBar />
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-11">
        <Outlet />
      </main>
    </div>
  )
}
