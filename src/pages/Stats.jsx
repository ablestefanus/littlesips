import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useFeeding } from '../context/FeedingContext.jsx'
import { MEAL_SLOTS, SLOT_KEYS, REACTIONS, toDateKey, isSameDay, DAYS_SHORT } from '../utils.js'

function Ring({ value, max, color, label, sublabel }) {
  const circleRef = useRef()
  const r    = 48
  const circ = 2 * Math.PI * r

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(circleRef.current,
        { strokeDashoffset: circ },
        { strokeDashoffset: circ * (1 - Math.min(value / max, 1)), duration: 1.2, ease: 'power3.out', delay: 0.2 }
      )
    })
    return () => ctx.revert()
  }, [value, max])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg width="110" height="110" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--bg-alt)" strokeWidth="10" />
          <circle
            ref={circleRef}
            cx="60" cy="60" r={r}
            fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>{value}</span>
          <span style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
        </div>
      </div>
      {sublabel && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-mid)', marginTop: 4 }}>{sublabel}</div>}
    </div>
  )
}

function BarFill({ pct, color }) {
  const ref = useRef()
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power3.out', transformOrigin: 'left', delay: 0.15 })
    })
    return () => ctx.revert()
  }, [pct])
  return <div ref={ref} style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
}

export default function Stats() {
  const { logs } = useFeeding()
  const pageRef  = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = Array.from(pageRef.current?.children || [])
      gsap.set(els, { opacity: 1, y: 0 })
      gsap.fromTo(els,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  if (logs.length === 0) {
    return (
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 20 }}>Progress</h2>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No data yet</div>
          <div className="empty-text">Log some meals and your stats will appear here.</div>
        </div>
      </div>
    )
  }

  // ── Compute stats ──────────────────────────────────────────
  const today     = toDateKey(new Date())
  const todayLogs = logs.filter(l => l.date === today)
  const mealsDone = todayLogs.filter(l => l.foodsEaten.length > 0).length

  // Last 7 days completion
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const key    = toDateKey(d)
    const dayLog = logs.filter(l => l.date === key && l.foodsEaten.length > 0)
    return { label: DAYS_SHORT[d.getDay()], count: dayLog.length, date: d, key }
  })
  const maxCount = Math.max(...last7.map(d => d.count), 1)

  // Unique foods ever eaten
  const allFoods = new Set()
  logs.forEach(l => l.foodsEaten.forEach(f => allFoods.add(f)))

  // Top foods
  const foodCount = {}
  logs.forEach(l => l.foodsEaten.forEach(f => { foodCount[f] = (foodCount[f] || 0) + 1 }))
  const topFoods = Object.entries(foodCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxFoodCount = topFoods[0]?.[1] || 1

  // Reaction stats
  const reactions = { loved: 0, ok: 0, refused: 0 }
  logs.forEach(l => { if (l.reaction) reactions[l.reaction]++ })
  const totalReactions = Object.values(reactions).reduce((s, n) => s + n, 0)

  // Slot completion totals (all time)
  const slotDone = {}
  SLOT_KEYS.forEach(s => { slotDone[s] = logs.filter(l => l.slot === s && l.foodsEaten.length > 0).length })
  const uniqueDays = new Set(logs.map(l => l.date)).size

  return (
    <div ref={pageRef}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 20 }}>Progress</h2>

      {/* Today summary */}
      <div className="card card-padded" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Today</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
          <Ring value={mealsDone} max={SLOT_KEYS.length} color="var(--primary)" label="meals" sublabel="Today's meals" />
          <Ring value={allFoods.size} max={50} color="#7DD9B8" label="foods" sublabel="Unique foods" />
          <Ring value={uniqueDays} max={30} color="#F5A0B5" label="days" sublabel="Days tracked" />
        </div>
      </div>

      {/* 7-day activity */}
      <div className="card card-padded" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Last 7 days</div>
        <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 16 }}>Meals logged per day</div>
        <div className="bar-chart">
          {last7.map((d, i) => {
            const isToday = d.key === today
            const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0
            const palette = ['#8B6FE8','#B09CF0','#F5A0B5','#7DD9B8','#FFD4A3','#A3CCFF','#E8D0F5']
            return (
              <div key={i} className="bar-col">
                {d.count > 0 && <div className="bar-value">{d.count}</div>}
                <div
                  className="bar-fill"
                  style={{
                    height: `${Math.max(pct, 4)}%`,
                    background: isToday ? 'var(--primary)' : palette[i],
                    opacity: isToday ? 1 : 0.7,
                    borderRadius: '6px 6px 0 0',
                  }}
                />
                <div className="bar-label" style={{ color: isToday ? 'var(--primary)' : undefined, fontWeight: isToday ? 900 : 700 }}>
                  {d.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Meal slot completion */}
      <div className="card card-padded" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Meal slot completion</div>
        {SLOT_KEYS.map(sk => {
          const slot = MEAL_SLOTS[sk]
          const count = slotDone[sk]
          const pct = uniqueDays > 0 ? (count / uniqueDays) * 100 : 0
          return (
            <div key={sk} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{slot.icon} {slot.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)' }}>
                  {count}/{uniqueDays} days ({pct.toFixed(0)}%)
                </span>
              </div>
              <div style={{ height: 7, background: 'var(--bg-alt)', borderRadius: 99, overflow: 'hidden' }}>
                <BarFill pct={pct} color={slot.color} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Top foods */}
      {topFoods.length > 0 && (
        <div className="card card-padded" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Most-eaten foods</div>
          {topFoods.map(([food, count]) => (
            <div key={food} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{food}</span>
                <span style={{ fontSize: 12, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)' }}>{count}×</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-alt)', borderRadius: 99, overflow: 'hidden' }}>
                <BarFill pct={(count / maxFoodCount) * 100} color="var(--primary-light)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      {totalReactions > 0 && (
        <div className="card card-padded">
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Baby's reactions</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.entries(REACTIONS).map(([key, r]) => (
              <div key={key} style={{
                flex: 1, textAlign: 'center', padding: '12px 8px',
                background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 26 }}>{r.icon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginTop: 4 }}>
                  {reactions[key]}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
