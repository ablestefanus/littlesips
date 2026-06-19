import { useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext.jsx'
import pb from '../lib/pb.js'

// ── Risk zones (SB in µmol/L) ─────────────────────────────────
function getRisk(level) {
  if (!level && level !== 0) return null
  if (level < 85)  return { label: 'Normal',   color: '#7DD9B8', bg: 'rgba(125,217,184,0.12)', border: 'rgba(125,217,184,0.4)' }
  if (level < 170) return { label: 'Mild',     color: '#FFD700', bg: 'rgba(255,215,0,0.12)',   border: 'rgba(255,215,0,0.4)'   }
  if (level < 255) return { label: 'Moderate', color: '#FFA500', bg: 'rgba(255,165,0,0.12)',   border: 'rgba(255,165,0,0.4)'   }
  if (level < 340) return { label: 'High',     color: '#FF6B35', bg: 'rgba(255,107,53,0.12)',  border: 'rgba(255,107,53,0.4)'  }
  return            { label: 'Critical',        color: '#E53E3E', bg: 'rgba(229,62,62,0.12)',   border: 'rgba(229,62,62,0.4)'   }
}

const METHODS = ['Blood test', 'Transcutaneous meter', 'Visual assessment']
const APPT_TYPES = ['Jaundice checkup', 'Blood test', 'Phototherapy check', 'Follow-up', 'General']

// ── Add Reading Modal ─────────────────────────────────────────
function AddReadingModal({ onSave, onClose, editing }) {
  const [level,  setLevel]  = useState(editing?.level  ?? '')
  const [weight, setWeight] = useState(editing?.weight ?? '')
  const [method, setMethod] = useState(editing?.method || METHODS[0])
  const [date,   setDate]   = useState(editing?.date   || new Date().toISOString().slice(0, 10))
  const [time,   setTime]   = useState(editing?.time   || new Date().toTimeString().slice(0, 5))
  const [photo,  setPhoto]  = useState(editing?.phototherapy || false)
  const [notes,  setNotes]  = useState(editing?.notes  || '')
  const [saving, setSaving] = useState(false)
  const risk = getRisk(parseFloat(level))

  async function handleSave() {
    if (!level) return
    setSaving(true)
    await onSave({ level: parseFloat(level), weight: weight ? parseFloat(weight) : null, method, date, time, phototherapy: photo, notes }, editing?.id)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--card)', borderRadius: '20px', width: '100%', maxWidth: 480,
        padding: '24px 20px', boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{editing ? 'Edit Reading' : 'Add Bilirubin Reading'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-light)' }}>×</button>
        </div>

        <div className="field">
          <label>SB level (µmol/L)</label>
          <input type="number" step="1" min="0" max="700" placeholder="e.g. 145"
            value={level} onChange={e => setLevel(e.target.value)} autoFocus />
          {risk && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: risk.bg, border: `1px solid ${risk.border}`, fontSize: 13, fontWeight: 700, color: risk.color }}>
              {risk.label} — SB {parseFloat(level)} µmol/L
            </div>
          )}
        </div>

        <div className="field">
          <label>Baby's weight (kg) <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>(optional)</span></label>
          <input type="number" step="0.01" min="0" max="20" placeholder="e.g. 3.2"
            value={weight} onChange={e => setWeight(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14 }}>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px', cursor: 'pointer', fontSize: 14 }}>
          <input type="checkbox" checked={photo} onChange={e => setPhoto(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
          <span>Baby is under phototherapy (blue light)</span>
        </label>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Notes <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>(optional)</span></label>
          <textarea rows={2} placeholder="Doctor's notes, feeding status…" value={notes} onChange={e => setNotes(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <button className="btn btn-primary w-full" onClick={handleSave} disabled={!level || saving}>
          {saving ? 'Saving…' : editing ? 'Update reading' : 'Save reading'}
        </button>
      </div>
    </div>
  )
}

// ── Add Appointment Modal ─────────────────────────────────────
function AddAppointmentModal({ onSave, onClose, editing }) {
  const [date,     setDate]     = useState(editing?.date || '')
  const [time,     setTime]     = useState(editing?.time || '')
  const [type,     setType]     = useState(editing?.type || APPT_TYPES[0])
  const [doctor,   setDoctor]   = useState(editing?.doctor || '')
  const [location, setLocation] = useState(editing?.location || '')
  const [notes,    setNotes]    = useState(editing?.notes || '')
  const [saving,   setSaving]   = useState(false)

  async function handleSave() {
    if (!date) return
    setSaving(true)
    await onSave({ date, time, type, doctor, location, notes, done: editing?.done || false }, editing?.id)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--card)', borderRadius: '20px', width: '100%', maxWidth: 480,
        padding: '24px 20px', boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{editing ? 'Edit Appointment' : 'Add Appointment'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-light)' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Time <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>(optional)</span></label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Appointment type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14 }}>
            {APPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Doctor <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>(optional)</span></label>
          <input type="text" placeholder="Dr. Ahmad" value={doctor} onChange={e => setDoctor(e.target.value)} />
        </div>

        <div className="field">
          <label>Hospital / Clinic <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>(optional)</span></label>
          <input type="text" placeholder="Hospital name" value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Notes <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>(optional)</span></label>
          <textarea rows={2} placeholder="Bring previous test results…" value={notes} onChange={e => setNotes(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <button className="btn btn-primary w-full" onClick={handleSave} disabled={!date || saving}>
          {saving ? 'Saving…' : editing ? 'Update appointment' : 'Add appointment'}
        </button>
      </div>
    </div>
  )
}

// ── Levels Tab ────────────────────────────────────────────────
function LevelsTab({ userId }) {
  const [readings, setReadings] = useState([])
  const [showAdd,  setShowAdd]  = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await pb.collection('jaundice').getFullList({ filter: `user="${userId}"`, sort: '-date,-time' }).catch(() => [])
    setReadings(res)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  async function handleSave(data, id) {
    if (id) {
      await pb.collection('jaundice').update(id, data)
    } else {
      await pb.collection('jaundice').create({ user: userId, ...data })
    }
    await load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this reading?')) return
    await pb.collection('jaundice').delete(id)
    setReadings(prev => prev.filter(r => r.id !== id))
  }

  const latest = readings[0]
  const latestRisk = getRisk(latest?.level)

  return (
    <div>
      {/* Current level card */}
      {latest && (
        <div style={{
          background: latestRisk?.bg || 'var(--bg-alt)',
          border: `1.5px solid ${latestRisk?.border || 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '20px', marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Latest reading · {latest.date}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 700, color: latestRisk?.color || 'var(--text)', lineHeight: 1 }}>
            {latest.level}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 2 }}>µmol/L</div>
          <div style={{
            display: 'inline-block', marginTop: 10, padding: '4px 14px', borderRadius: 99,
            background: latestRisk?.color || 'var(--primary)', color: 'white',
            fontSize: 13, fontWeight: 800,
          }}>{latestRisk?.label}</div>
          {latest.phototherapy && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-mid)' }}>💡 Under phototherapy</div>
          )}
        </div>
      )}

      {/* Risk guide */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Normal',   range: '< 85',    color: '#7DD9B8' },
          { label: 'Mild',     range: '85–170',  color: '#FFD700' },
          { label: 'Moderate', range: '170–255', color: '#FFA500' },
          { label: 'High',     range: '255–340', color: '#FF6B35' },
          { label: 'Critical', range: '> 340',   color: '#E53E3E' },
        ].map(z => (
          <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-mid)', background: 'var(--bg-alt)', padding: '4px 8px', borderRadius: 99 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: z.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 700 }}>{z.label}</span> {z.range} µmol/L
          </div>
        ))}
      </div>

      <button className="btn btn-primary w-full" onClick={() => setShowAdd(true)} style={{ marginBottom: 16 }}>
        + Add reading
      </button>

      {/* History */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>Loading…</div>
      ) : readings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🟡</div>
          <div className="empty-title">No readings yet</div>
          <div className="empty-text">Add your first bilirubin reading above.</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            History ({readings.length})
          </div>
          {readings.map((r, i) => {
            const risk = getRisk(r.level)
            const prev = readings[i + 1]
            const delta = prev ? (r.level - prev.level) : null
            return (
              <div key={r.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: risk?.bg || 'var(--bg-alt)', border: `2px solid ${risk?.color || 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: risk?.color,
                }}>
                  {r.level}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.level} µmol/L</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                      background: risk?.bg, color: risk?.color, border: `1px solid ${risk?.border}`,
                    }}>{risk?.label}</span>
                    {delta !== null && (
                      <span style={{ fontSize: 11, color: delta > 0 ? '#E53E3E' : '#7DD9B8', fontWeight: 700 }}>
                        {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>
                    {r.date}{r.time ? ` · ${r.time}` : ''} · {r.method}
                    {r.weight ? ` · ⚖️ ${r.weight} kg` : ''}
                    {r.phototherapy ? ' · 💡 Phototherapy' : ''}
                  </div>
                  {r.notes && <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 3 }}>{r.notes}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => { setEditing(r); setShowAdd(true) }}
                    style={{ background: 'none', border: 'none', fontSize: 15, cursor: 'pointer', color: 'var(--text-light)', padding: 4 }}>✏️</button>
                  <button onClick={() => handleDelete(r.id)}
                    style={{ background: 'none', border: 'none', fontSize: 15, cursor: 'pointer', color: 'var(--text-light)', padding: 4 }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && <AddReadingModal onSave={handleSave} onClose={() => { setShowAdd(false); setEditing(null) }} editing={editing} />}
    </div>
  )
}

// ── Appointments Tab ──────────────────────────────────────────
function AppointmentsTab({ userId }) {
  const [appointments, setAppointments] = useState([])
  const [showAdd,      setShowAdd]      = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [loading,      setLoading]      = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await pb.collection('appointments').getFullList({ filter: `user="${userId}"`, sort: 'date,time' }).catch(() => [])
    setAppointments(res)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  async function handleSave(data, id) {
    if (id) {
      await pb.collection('appointments').update(id, data)
    } else {
      await pb.collection('appointments').create({ user: userId, ...data })
    }
    await load()
  }

  async function toggleDone(appt) {
    await pb.collection('appointments').update(appt.id, { done: !appt.done })
    setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, done: !a.done } : a))
  }

  async function handleDelete(id) {
    if (!confirm('Delete this appointment?')) return
    await pb.collection('appointments').delete(id)
    setAppointments(prev => prev.filter(a => a.id !== id))
  }

  const today    = new Date().toISOString().slice(0, 10)
  const upcoming = appointments.filter(a => !a.done && a.date >= today)
  const past     = appointments.filter(a => a.done || a.date < today)

  function ApptCard({ appt }) {
    const isPast = appt.done || appt.date < today
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '14px 16px', marginBottom: 8, opacity: isPast ? 0.7 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button onClick={() => toggleDone(appt)} style={{
            width: 24, height: 24, borderRadius: '50%', border: `2px solid ${appt.done ? '#7DD9B8' : 'var(--border)'}`,
            background: appt.done ? '#7DD9B8' : 'transparent', flexShrink: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', marginTop: 1,
          }}>
            {appt.done ? '✓' : ''}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, textDecoration: appt.done ? 'line-through' : 'none' }}>
              {appt.type}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>
              📅 {appt.date}{appt.time ? ` · ${appt.time}` : ''}
            </div>
            {appt.doctor   && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 1 }}>👨‍⚕️ {appt.doctor}</div>}
            {appt.location && <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 1 }}>📍 {appt.location}</div>}
            {appt.notes    && <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>{appt.notes}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <button onClick={() => { setEditing(appt); setShowAdd(true) }}
              style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: 'var(--text-light)' }}>✏️</button>
            <button onClick={() => handleDelete(appt.id)}
              style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', color: 'var(--text-light)' }}>🗑</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button className="btn btn-primary w-full" onClick={() => { setEditing(null); setShowAdd(true) }} style={{ marginBottom: 16 }}>
        + Add appointment
      </button>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>Loading…</div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <div className="empty-title">No appointments yet</div>
          <div className="empty-text">Add doctor visits and checkups to track them here.</div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Upcoming ({upcoming.length})
              </div>
              {upcoming.map(a => <ApptCard key={a.id} appt={a} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: upcoming.length > 0 ? 16 : 0 }}>
                Past ({past.length})
              </div>
              {past.map(a => <ApptCard key={a.id} appt={a} />)}
            </>
          )}
        </>
      )}

      {showAdd && (
        <AddAppointmentModal
          onSave={handleSave}
          onClose={() => { setShowAdd(false); setEditing(null) }}
          editing={editing}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function Jaundice() {
  const { user }  = useAuth()
  const [tab, setTab] = useState('levels')
  const pageRef   = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = Array.from(pageRef.current?.children || [])
      gsap.fromTo(els, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [])

  return (
    <div ref={pageRef}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 6 }}>Jaundice Tracker</h2>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 16 }}>
        Track bilirubin levels and doctor appointments.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-alt)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 20 }}>
        {[
          { id: 'levels',       label: '🟡 Bilirubin Levels' },
          { id: 'appointments', label: '📅 Appointments'     },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '9px 8px', borderRadius: 'calc(var(--radius) - 4px)',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.18s',
            background: tab === t.id ? 'var(--card)' : 'transparent',
            color:      tab === t.id ? 'var(--primary)' : 'var(--text-mid)',
            boxShadow:  tab === t.id ? 'var(--shadow)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'levels'       && <LevelsTab       userId={user?.id} />}
      {tab === 'appointments' && <AppointmentsTab userId={user?.id} />}
    </div>
  )
}
