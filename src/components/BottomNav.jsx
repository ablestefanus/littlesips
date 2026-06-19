import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext.jsx'

// Profile (Baby's Profile) is first — leftmost on mobile
const BASE_ITEMS = [
  { id: 'profile',   icon: '🍼', label: 'Profile' },
  { id: 'dashboard', icon: '🏠', label: 'Home' },
  { id: 'menu',      icon: '🗓️', label: 'Menu' },
  { id: 'history',   icon: '📋', label: 'History' },
  { id: 'stats',     icon: '📊', label: 'Stats' },
]

const ADMIN_ITEM = { id: 'admin', icon: '⚙️', label: 'Admin' }

export default function BottomNav({ current, onNavigate }) {
  const { user } = useAuth()
  const navRef   = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = Array.from(navRef.current?.children || [])
      gsap.set(items, { opacity: 1, y: 0 })
      gsap.fromTo(items,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.8)', delay: 0.2 }
      )
    })
    return () => ctx.revert()
  }, [])

  const items = user?.isAdmin
    ? [...BASE_ITEMS.slice(0, 4), ADMIN_ITEM]
    : BASE_ITEMS

  return (
    <nav className="bottom-nav" ref={navRef}>
      {items.map(item => (
        <button
          key={item.id}
          className={`nav-item ${current === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          aria-label={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
