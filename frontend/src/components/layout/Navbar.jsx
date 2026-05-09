import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, BarChart2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const NAV_LINKS = [
  { to: '/',           label: 'Dashboard'   },
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
    <nav className="sticky top-0 z-50 h-14 bg-white border-b border-slate-200 flex items-center px-6">

      {/* Logo */}
      <div className="flex items-center gap-2 mr-8 shrink-0">
        <BarChart2 size={18} className="text-blue-600" />
        <span className="font-bold text-blue-600 font-mono text-base leading-none">PECDF</span>
        <span className="text-slate-300 text-xs hidden lg:block ml-1">
          Pakistan Export Forecasting
        </span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
          <span className="hidden sm:block bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full font-medium max-w-[180px] truncate">
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
