import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext.jsx'
import BabyMobile from './BabyMobile.jsx'

const ITEMS = [
  { id: 'dashboard', icon: '🏠', label: 'Home' },
  { id: 'history',   icon: '📋', label: 'Feeding History' },
  { id: 'menu',      icon: '🗓️', label: 'Weekly Menu' },
  { id: 'stats',     icon: '📊', label: 'Progress & Stats' },
  { id: 'profile',   icon: '👤', label: 'Profile' },
]

export default function Sidebar({ current, onNavigate, onAdd }) {
  const { user, logout } = useAuth()
  const sidebarRef = useRef()

  useEffect(() => {
    const items = sidebarRef.current?.querySelectorAll('.sidebar-item')
    if (items) {
      gsap.from(items, {
        x: -24,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: 'power2.out',
        delay: 0.1,
      })
    }
  }, [])

  return (
    <aside className="app-sidebar" ref={sidebarRef} style={{ display: 'none' }}
      // show via media query in CSS, but we inline-override for clarity
      id="desktop-sidebar">
      <div className="sidebar-logo">
        <BabyMobile size={48} />
        <span className="sidebar-logo-text">Little<span>Sips</span></span>
      </div>

      <nav className="sidebar-nav">
        {ITEMS.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${current === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="s-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button
          className="btn btn-primary w-full"
          style={{ marginTop: 16, borderRadius: 'var(--radius-sm)' }}
          onClick={onAdd}
        >
          🍼 Log Feeding
        </button>
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
          {user?.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 10 }}>
          {user?.email}
        </div>
        <button className="btn btn-ghost" style={{ padding: '8px 0', color: 'var(--text-light)', fontSize: 13 }} onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
