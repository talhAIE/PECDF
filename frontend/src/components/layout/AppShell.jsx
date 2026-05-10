import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import MacroBar from './MacroBar'

export default function AppShell() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <MacroBar />
      <main className="mx-auto w-full min-w-0 max-w-[1440px] px-4 py-9 sm:px-6 lg:px-10 lg:py-12">
        <Outlet />
      </main>
    </div>
  )
}
