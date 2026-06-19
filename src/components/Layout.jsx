import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import BabyMobile from './BabyMobile.jsx'
import BottomNav from './BottomNav.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { babyAgeLabel } from '../utils.js'

const PAGE_LABELS = {
  profile:   "Baby's Profile",
  dashboard: 'Today',
  menu:      'Weekly Menu',
  history:   'History',
  stats:     'Progress',
  admin:     'Admin Panel',
}

const PAGE_ICONS = {
  profile:   '🍼',
  dashboard: '🏠',
  history:   '📋',
  menu:      '🗓️',
  stats:     '📊',
  admin:     '⚙️',
}

// Profile is first — above Today
const SIDEBAR_ITEMS = [
  { id: 'profile',   icon: '🍼', label: "Baby's Profile" },
  { id: 'dashboard', icon: '🏠', label: 'Today' },
  { id: 'menu',      icon: '🗓️', label: 'Weekly Menu' },
  { id: 'history',   icon: '📋', label: 'History' },
  { id: 'stats',     icon: '📊', label: 'Progress' },
]

export default function Layout({ current, onNavigate, children }) {
  const { user, logout } = useAuth()
  const contentRef = useRef()
  const sidebarRef = useRef()
  const prevPage   = useRef(current)

  useEffect(() => {
    if (prevPage.current !== current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      )
      prevPage.current = current
    }
  }, [current])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = sidebarRef.current?.querySelectorAll('.sidebar-item')
      if (items?.length) {
        gsap.set(items, { opacity: 1, x: 0 })
        gsap.fromTo(items,
          { x: -16, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out', delay: 0.08 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const initials  = (user?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const ageLabel  = user?.babyDob ? babyAgeLabel(user.babyDob) : null
  const babyPhoto = user?.babyPhoto

  function Avatar({ size = 32, fontSize = 12 }) {
    return babyPhoto ? (
      <img
        src={babyPhoto}
        alt="Baby"
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '2px solid var(--primary-light)',
        }}
      />
    ) : (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
        color: 'white', fontWeight: 900, fontSize,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {initials}
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <aside className="app-sidebar" ref={sidebarRef}>
        <div className="sidebar-logo">
          <BabyMobile size={44} />
          <span className="sidebar-logo-text">Little<span>Sips</span></span>
        </div>

        <nav className="sidebar-nav">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${current === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="s-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          {user?.isAdmin && (
            <button
              className={`sidebar-item ${current === 'admin' ? 'active' : ''}`}
              onClick={() => onNavigate('admin')}
              style={{ marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 12 }}
            >
              <span className="s-icon">⚙️</span>
              Admin Panel
              <span style={{
                marginLeft: 'auto', fontSize: 9, fontWeight: 900,
                background: '#FFD700', color: '#7A5500',
                padding: '2px 6px', borderRadius: 99, textTransform: 'uppercase',
              }}>Admin</span>
            </button>
          )}

          <div style={{ flex: 1 }} />
        </nav>

        {/* Sidebar footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Avatar size={36} fontSize={13} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </span>
                {user?.isAdmin && (
                  <span style={{ fontSize: 9, fontWeight: 900, background: '#FFD700', color: '#7A5500', padding: '1px 5px', borderRadius: 99, textTransform: 'uppercase', flexShrink: 0 }}>
                    Admin
                  </span>
                )}
              </div>
              {(user?.babyName || ageLabel) && (
                <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>
                  {user?.babyName || 'Baby'}{ageLabel ? ` · ${ageLabel}` : ''}
                </div>
              )}
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 0', color: 'var(--text-light)', fontSize: 12, width: '100%', justifyContent: 'flex-start' }}
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="app-main">
        <header className="app-header">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>
              {PAGE_ICONS[current]} {PAGE_LABELS[current]}
            </div>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Avatar size={36} fontSize={13} />
          </button>
        </header>

        <div className="app-content" ref={contentRef}>
          {children}
        </div>
      </main>

      <BottomNav current={current} onNavigate={onNavigate} />
    </div>
  )
}
