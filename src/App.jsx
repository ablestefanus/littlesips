import { useState, useRef } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { FeedingProvider } from './context/FeedingContext.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import History from './pages/History.jsx'
import Menu from './pages/Menu.jsx'
import Stats from './pages/Stats.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import Layout from './components/Layout.jsx'
import Toast from './components/Toast.jsx'

function AppInner() {
  const { user, loading } = useAuth()
  const [page, setPage]   = useState('dashboard')
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef()

  function showToast(msg) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ show: true, message: msg })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ fontSize: 40, animation: 'float-up-down 1.5s ease-in-out infinite' }}>🍼</div>
      </div>
    )
  }

  if (!user) return <Auth />

  const pages = {
    dashboard: <Dashboard />,
    history:   <History />,
    menu:      <Menu />,
    stats:     <Stats />,
    profile:   <Profile />,
    admin:     <Admin />,
  }

  return (
    <>
      <Layout current={page} onNavigate={setPage}>
        {pages[page] || pages.dashboard}
      </Layout>
      <Toast message={toast.message} show={toast.show} />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <FeedingProvider>
        <AppInner />
      </FeedingProvider>
    </AuthProvider>
  )
}
