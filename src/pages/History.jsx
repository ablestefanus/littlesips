import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { useFeeding } from '../context/FeedingContext.jsx'
import { MEAL_SLOTS, REACTIONS, SLOT_KEYS, formatDate, formatTime } from '../utils.js'
import LogMealModal from '../components/LogMealModal.jsx'

function DayGroup({ dateKey, logs, onEdit }) {
  const slotLogs = SLOT_KEYS.map(s => ({ slotKey: s, log: logs.find(l => l.slot === s) })).filter(x => x.log)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-light)', marginBottom: 8 }}>
        {formatDate(dateKey)}
        <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>
          {slotLogs.length}/{SLOT_KEYS.length} meals
        </span>
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {slotLogs.map(({ slotKey, log }, i) => {
          const slot     = MEAL_SLOTS[slotKey]
          const reaction = log.reaction ? REACTIONS[log.reaction] : null
          return (
            <div
              key={slotKey}
              onClick={() => onEdit(log)}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 16px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: slot.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {slot.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: slot.color }}>{slot.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {reaction && <span style={{ fontSize: 14 }}>{reaction.icon}</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
                      {formatTime(log.loggedAt)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {log.foodsEaten.map(f => (
                    <span key={f} style={{
                      fontSize: 11, padding: '2px 7px', fontWeight: 600,
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 99, color: 'var(--text-mid)',
                    }}>{f}</span>
                  ))}
                </div>
                {log.notes && (
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4, fontStyle: 'italic' }}>
                    {log.notes.slice(0, 80)}{log.notes.length > 80 ? '…' : ''}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function History() {
  const { logs, logMeal } = useFeeding()
  const [editingLog, setEditingLog] = useState(null)
  const pageRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = Array.from(pageRef.current?.children || [])
      gsap.set(els, { opacity: 1, y: 0 })
      gsap.fromTo(els,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.38, stagger: 0.07, ease: 'power2.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  const byDate = {}
  ;[...logs]
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
    .forEach(l => {
      if (!byDate[l.date]) byDate[l.date] = []
      byDate[l.date].push(l)
    })
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  function handleSaveEdit(data) {
    if (!editingLog) return
    const [year, month, day] = editingLog.date.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    logMeal({ date, slot: editingLog.slot, ...data })
    setEditingLog(null)
  }

  if (logs.length === 0) {
    return (
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 6 }}>History</h2>
        <div className="empty-state" style={{ paddingTop: 48 }}>
          <div className="empty-icon">🕐</div>
          <div className="empty-title">No meals logged yet</div>
          <div className="empty-text">Head to the Dashboard to start logging your baby's meals.</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={pageRef}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 2 }}>History</h2>
        <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>
          {logs.length} meal{logs.length !== 1 ? 's' : ''} logged across {dates.length} day{dates.length !== 1 ? 's' : ''}
        </p>
      </div>

      {dates.map(date => (
        <DayGroup key={date} dateKey={date} logs={byDate[date]} onEdit={setEditingLog} />
      ))}

      {editingLog && (
        <LogMealModal
          isOpen
          slot={editingLog.slot}
          date={editingLog.date}
          plannedFoods={editingLog.plannedFoods || []}
          existingLog={editingLog}
          onClose={() => setEditingLog(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}
