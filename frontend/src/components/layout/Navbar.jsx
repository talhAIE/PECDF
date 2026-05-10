import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, BarChart2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard'   },
  { to: '/forecast',   label: 'Forecast'    },
  { to: '/scenario',   label: 'Scenarios'   },
  { to: '/commodity/1006', label: 'Commodities' },
  { to: '/analyst',    label: 'AI Analyst'  },
  { to: '/report',     label: 'Reports'     },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  function handleLogout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center border-b border-slate-200/80 bg-white/90 px-3 shadow-sm shadow-slate-900/5 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 sm:px-6">

      {/* Logo */}
      <NavLink to="/dashboard" className="mr-3 flex shrink-0 items-center gap-2 rounded-lg hover:opacity-90 sm:mr-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-600/30">
          <BarChart2 size={17} strokeWidth={2.5} />
        </span>
        <span className="font-display text-base font-bold leading-none tracking-tight text-slate-900">PECDF</span>
        <span className="ml-1 hidden text-xs text-slate-400 lg:block">Pakistan Export Forecasting</span>
      </NavLink>

      {/* Nav links — scroll on small screens so nothing is clipped */}
      <div
        className="-mx-1 flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="navigation"
        aria-label="Main"
      >
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100/80'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* User pill + logout */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {user?.email && (
          <span
            className="hidden max-w-[10rem] truncate rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 md:block"
            title={user.email}
          >
            {user.email}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut size={16} aria-hidden />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </nav>
  )
}
