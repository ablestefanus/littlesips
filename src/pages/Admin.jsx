import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext.jsx'
import { MEAL_SLOTS, formatDate, formatTime } from '../utils.js'
import pb from '../lib/pb.js'

function UserRow({ u, isExpanded, onToggle }) {
  const [logs, setLogs] = useState([])
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!isExpanded) return
    pb.collection('logs').getFullList({ filter: `user="${u.id}"`, sort: '-loggedAt' })
      .then(setLogs).catch(() => {})
  }, [isExpanded, u.id])

  const todayLogs = logs.filter(l => l.date === today)

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      marginBottom: 10, overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: u.isAdmin
            ? 'linear-gradient(135deg, #FFD700, #FFA500)'
            : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: 14,
        }}>
          {(u.name || '?').slice(0, 2).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{u.name}</span>
            {u.isAdmin && (
              <span style={{ fontSize: 10, fontWeight: 900, background: '#FFD700', color: '#7A5500', padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase' }}>Admin</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 1 }}>{u.name}</div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
            {isExpanded ? 'Hide' : 'View'}
          </div>
        </div>

        <div style={{ fontSize: 18, color: 'var(--text-light)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
          ▾
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 12, padding: '12px 0 14px', flexWrap: 'wrap' }}>
            {[
              { label: "Today's meals", val: todayLogs.length, icon: '📅' },
              { label: 'Total meals',   val: logs.length,      icon: '🍽️' },
              { label: 'Joined',        val: formatDate(u.created), icon: '📆' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', flex: '1 1 100px' }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500 }}>{s.val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {logs.length > 0 ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Recent meals
              </div>
              {logs.slice(0, 5).map(l => {
                const slot = MEAL_SLOTS[l.slot]
                return (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 18 }}>{slot?.icon}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{slot?.label}</span>
                      <span style={{ color: 'var(--text-mid)', fontSize: 12 }}> · {(l.foodsEaten || []).join(', ').slice(0, 40)}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mid)' }}>
                      {l.date} {l.loggedAt ? formatTime(l.loggedAt) : ''}
                    </span>
                  </div>
                )
              })}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-light)', padding: '8px 0' }}>No meals logged yet.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const [users,    setUsers]    = useState([])
  const [expanded, setExpanded] = useState(null)
  const pageRef = useRef()

  useEffect(() => {
    if (!user?.isAdmin) return
    pb.collection('users').getFullList({ sort: 'created' })
      .then(records => {
        const admins = (import.meta.env.VITE_ADMIN_USERNAMES || 'stefanus').split(',')
        setUsers(records.map(r => ({
          ...r,
          name: r.name || r.email?.split('@')[0] || '',
          isAdmin: admins.includes((r.name || '').toLowerCase()),
        })))
      }).catch(() => {})
  }, [user?.isAdmin])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = Array.from(pageRef.current?.children || [])
      gsap.set(els, { opacity: 1, y: 0 })
      gsap.fromTo(els,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  if (!user?.isAdmin) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <div className="empty-title">Access denied</div>
        <div className="empty-text">This area is for admins only.</div>
      </div>
    )
  }

  return (
    <div ref={pageRef}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>Admin Panel</h2>
        <span style={{ fontSize: 11, fontWeight: 900, background: '#FFD700', color: '#7A5500', padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase' }}>Admin</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 20 }}>Signed in as {user.name}</p>

      <div className="stats-row" style={{ marginBottom: 20 }}>
        {[
          { icon: '👥', val: users.length, label: 'Users' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Registered users ({users.length})
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <div className="empty-title">No users yet</div>
          <div className="empty-text">Registered accounts will appear here.</div>
        </div>
      ) : (
        users.map(u => (
          <UserRow
            key={u.id}
            u={u}
            isExpanded={expanded === u.id}
            onToggle={() => setExpanded(expanded === u.id ? null : u.id)}
          />
        ))
      )}
    </div>
  )
}
