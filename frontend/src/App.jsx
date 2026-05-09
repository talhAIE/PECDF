import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/auth/AuthGuard'
import AppShell from './components/layout/AppShell'
import ErrorBoundary from './components/ErrorBoundary'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import ForecastCenter     from './pages/ForecastCenter'
import ScenarioSimulator  from './pages/ScenarioSimulator'
import CommodityExplorer  from './pages/CommodityExplorer'
import AIAnalyst          from './pages/AIAnalyst'
import ReportGenerator    from './pages/ReportGenerator'
import LandingPage        from './pages/LandingPage'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard"     element={<Dashboard />} />
            <Route path="/forecast"      element={<ForecastCenter />} />
            <Route path="/scenario"      element={<ScenarioSimulator />} />
            <Route path="/commodity/:hs" element={<CommodityExplorer />} />
            <Route path="/analyst"       element={<ErrorBoundary><AIAnalyst /></ErrorBoundary>} />
            <Route path="/report"        element={<ErrorBoundary><ReportGenerator /></ErrorBoundary>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
