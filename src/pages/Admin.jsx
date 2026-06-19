import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext.jsx'
import { MEAL_SLOTS, formatDate, formatTime } from '../utils.js'

function UserRow({ u, getAllLogs, isExpanded, onToggle }) {
  const logs      = getAllLogs(u.id)
  const today     = new Date().toISOString().slice(0, 10)
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
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 1 }}>{u.email}</div>
          {u.babyName && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 1 }}>🍼 {u.babyName}</div>}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--primary)' }}>{logs.length}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>meals logged</div>
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
              { label: 'Total meals', val: logs.length, icon: '🍽️' },
              { label: 'Joined', val: u.createdAt ? formatDate(u.createdAt) : '—', icon: '📆' },
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
              {[...logs]
                .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
                .slice(0, 5)
                .map(l => {
                  const slot = MEAL_SLOTS[l.slot]
                  return (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 18 }}>{slot?.icon}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{slot?.label}</span>
                        <span style={{ color: 'var(--text-mid)', fontSize: 12 }}> · {l.foodsEaten.join(', ').slice(0, 40)}</span>
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
  const { user, getAllUsers, getAllLogs } = useAuth()
  const [expanded, setExpanded] = useState(null)
  const pageRef = useRef()

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

  const users   = getAllUsers()
  const today   = new Date().toISOString().slice(0, 10)
  const totalLogs  = users.reduce((s, u) => s + getAllLogs(u.id).length, 0)
  const totalToday = users.reduce((s, u) => s + getAllLogs(u.id).filter(l => l.date === today).length, 0)

  return (
    <div ref={pageRef}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>Admin Panel</h2>
        <span style={{ fontSize: 11, fontWeight: 900, background: '#FFD700', color: '#7A5500', padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase' }}>Admin</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 20 }}>Signed in as {user.email}</p>

      <div className="stats-row" style={{ marginBottom: 20 }}>
        {[
          { icon: '👥', val: users.length, label: 'Users' },
          { icon: '🍽️', val: totalLogs,   label: 'All meals' },
          { icon: '📅', val: totalToday,  label: 'Today' },
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
            getAllLogs={getAllLogs}
            isExpanded={expanded === u.id}
            onToggle={() => setExpanded(expanded === u.id ? null : u.id)}
          />
        ))
      )}
    </div>
  )
}
