import { useEffect, useState } from 'react'
import Workspace from './page/workspace'
import LoginPage from './page/login'
import RegisterPage from './page/register'
import ForgotPage from './page/forgot'
import ResetPage from './page/reset'
import PricingPage from './page/pricing'
import AdminPage from './page/admin'

type Route = 'workspace' | 'login' | 'register' | 'forgot' | 'reset' | 'pricing' | 'admin'

const getRoute = (): Route => {
  if (typeof window === 'undefined') return 'workspace'
  const path = window.location.pathname.toLowerCase()
  if (path === '/login') return 'login'
  if (path === '/register') return 'register'
  if (path === '/forgot') return 'forgot'
  if (path === '/reset') return 'reset'
  if (path === '/pricing') return 'pricing'
  if (path === '/admin') return 'admin'
  return 'workspace'
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute)

  useEffect(() => {
    const handlePop = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  if (route === 'login') return <LoginPage />
  if (route === 'register') return <RegisterPage />
  if (route === 'forgot') return <ForgotPage />
  if (route === 'reset') return <ResetPage />
  if (route === 'pricing') return <PricingPage />
  if (route === 'admin') return <AdminPage />

  return <Workspace />
}
