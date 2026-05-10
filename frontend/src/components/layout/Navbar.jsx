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
    <nav className="sticky top-0 z-50 flex h-14 items-center border-b border-slate-200/80 bg-white/85 px-6 shadow-sm shadow-slate-900/5 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">

      {/* Logo */}
      <NavLink to="/dashboard" className="mr-8 flex shrink-0 items-center gap-2 rounded-lg outline-offset-2 hover:opacity-90">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-600/30">
          <BarChart2 size={17} strokeWidth={2.5} />
        </span>
        <span className="font-display text-base font-bold leading-none tracking-tight text-slate-900">PECDF</span>
        <span className="ml-1 hidden text-xs text-slate-400 lg:block">Pakistan Export Forecasting</span>
      </NavLink>

      {/* Nav links */}
      <div className="flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 font-semibold text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* User pill + logout */}
      <div className="flex items-center gap-3 shrink-0">
        {user?.email && (
          <span className="hidden max-w-[180px] truncate rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 sm:block">
            {user.email}
          </span>
        )}
        <button
          onClick={handleLogout}
          title="Logout"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  )
}
