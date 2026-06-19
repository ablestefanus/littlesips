import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { useFeeding } from '../context/FeedingContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  MEAL_SLOTS, SLOT_KEYS, REACTIONS, toDateKey,
  babyAgeLabel, getMPASIInfo, calcMPASIStart, getScheduleEntry, TOTAL_MPASI_WEEKS,
} from '../utils.js'
import { MENU_TEMPLATES } from '../data/menuTemplates.js'

function getCurrentSlot() {
  const h = new Date().getHours()
  if (h < 9)  return 'breakfast'
  if (h < 11) return 'teatime1'
  if (h < 14) return 'lunch'
  if (h < 17) return 'teatime2'
  return 'dinner'
}

// ─── Inline meal slot card ────────────────────────────────────
function MealSlotCard({ slotKey, plannedFoods, existingLog, onSave, isCurrentSlot }) {
  const slot = MEAL_SLOTS[slotKey]

  const initFoods  = existingLog?.foodsEaten || []
  const initExtra  = initFoods.filter(f => !(plannedFoods || []).includes(f))

  const [eaten,    setEaten]    = useState(() => new Set(initFoods))
  const [foodRxns, setFoodRxns] = useState(() => ({ ...(existingLog?.foodReactions || {}) }))
  const [extra,    setExtra]    = useState(() => initExtra)
  const [notes,    setNotes]    = useState(() => existingLog?.notes || '')
  const [notesOpen, setNotesOpen] = useState(() => !!(existingLog?.notes))
  const [addingFood, setAddingFood] = useState(false)
  const [addInput,  setAddInput]   = useState('')
  const [collapsed, setCollapsed]  = useState(false)
  const addRef  = useRef()
  const cardRef = useRef()

  useEffect(() => {
    if (!cardRef.current) return
    const ctx = gsap.context(() => {
      gsap.set(cardRef.current, { opacity: 1, y: 0 })
      gsap.fromTo(cardRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.4)' })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (addingFood) addRef.current?.focus()
  }, [addingFood])

  const allFoods   = [...(plannedFoods || []), ...extra]
  const eatenCount = allFoods.filter(f => eaten.has(f)).length
  const totalCount = allFoods.length
  const isDone     = totalCount > 0 && eatenCount === totalCount
  const hasAny     = eatenCount > 0

  function save(eatSet, rxns, xtra, nts) {
    const all = [...(plannedFoods || []), ...xtra]
    const foodsEaten = all.filter(f => eatSet.has(f))
    const counts = {}
    foodsEaten.forEach(f => { const r = rxns[f]; if (r) counts[r] = (counts[r] || 0) + 1 })
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    onSave({ slot: slotKey, foodsEaten, plannedFoods: plannedFoods || [], reaction: dominant, foodReactions: rxns, notes: nts })
  }

  function toggleFood(food) {
    const next = new Set(eaten)
    const nextRxns = { ...foodRxns }
    if (next.has(food)) { next.delete(food); delete nextRxns[food] }
    else next.add(food)
    setEaten(next); setFoodRxns(nextRxns)
    save(next, nextRxns, extra, notes)
  }

  function toggleReaction(food, key) {
    const nextRxns = { ...foodRxns }
    if (nextRxns[food] === key) delete nextRxns[food]
    else nextRxns[food] = key
    setFoodRxns(nextRxns)
    save(eaten, nextRxns, extra, notes)
  }

  function commitAdd() {
    const v = addInput.trim()
    if (!v) { setAddingFood(false); return }
    if (!extra.includes(v) && !(plannedFoods || []).includes(v)) {
      const nextExtra = [...extra, v]
      const nextEaten = new Set([...eaten, v])
      setExtra(nextExtra); setEaten(nextEaten)
      save(nextEaten, foodRxns, nextExtra, notes)
    }
    setAddInput(''); setAddingFood(false)
  }

  function removeExtra(food) {
    const nextExtra = extra.filter(f => f !== food)
    const nextEaten = new Set(eaten); nextEaten.delete(food)
    const nextRxns  = { ...foodRxns }; delete nextRxns[food]
    setExtra(nextExtra); setEaten(nextEaten); setFoodRxns(nextRxns)
    save(nextEaten, nextRxns, nextExtra, notes)
  }

  function updateNotes(v) {
    setNotes(v)
    save(eaten, foodRxns, extra, v)
  }

  const borderColor = isDone ? slot.color : hasAny ? `${slot.color}70` : 'var(--border)'
  const bgColor     = isDone ? slot.bg    : hasAny ? `${slot.bg}88`    : 'var(--card)'

  return (
    <div ref={cardRef} style={{
      background: bgColor, borderRadius: 'var(--radius)',
      border: `2px solid ${isCurrentSlot && !isDone ? slot.color : borderColor}`,
      marginBottom: 12, overflow: 'hidden', transition: 'border-color 0.25s, background 0.25s',
    }}>
      {/* ── Header (always visible) ── */}
      <div onClick={() => setCollapsed(c => !c)} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px', cursor: 'pointer',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: isDone ? slot.color : 'rgba(255,255,255,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, transition: 'all 0.25s',
          boxShadow: isDone ? `0 2px 10px ${slot.color}40` : 'none',
        }}>{slot.icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 14, color: isDone ? slot.color : 'var(--text)' }}>{slot.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{slot.malay}</span>
            {isCurrentSlot && !isDone && (
              <span style={{ fontSize: 9, fontWeight: 900, background: slot.color, color: 'white', padding: '1px 6px', borderRadius: 99, textTransform: 'uppercase' }}>Now</span>
            )}
          </div>
          {totalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99, transition: 'width 0.35s ease',
                  background: isDone ? slot.color : `${slot.color}99`,
                  width: `${totalCount > 0 ? (eatenCount / totalCount) * 100 : 0}%`,
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, flexShrink: 0, color: isDone ? slot.color : 'var(--text-mid)' }}>
                {eatenCount}/{totalCount}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isDone && <span style={{ fontSize: 18, color: slot.color }}>✓</span>}
          <span style={{
            fontSize: 14, color: 'var(--text-light)',
            transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'none',
          }}>▾</span>
        </div>
      </div>

      {/* ── Body (collapsible) ── */}
      {!collapsed && (
        <div style={{ borderTop: `1px solid ${borderColor}50` }}>
          {allFoods.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-light)', textAlign: 'center' }}>
              No menu planned — add foods below
            </div>
          )}

          {allFoods.map((food, idx) => {
            const isEaten  = eaten.has(food)
            const rxn      = foodRxns[food]
            const isCustom = extra.includes(food)
            const notLast  = idx < allFoods.length - 1 || addingFood || notesOpen
            return (
              <div key={food} style={{ borderBottom: notLast ? `1px solid ${borderColor}30` : 'none' }}>
                {/* Food row */}
                <div
                  onClick={() => toggleFood(food)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    border: `2.5px solid ${isEaten ? slot.color : 'var(--border)'}`,
                    background: isEaten ? slot.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.18s',
                  }}>
                    {isEaten && <span style={{ color: 'white', fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: isEaten ? 'var(--text)' : 'var(--text-mid)' }}>
                    {food}
                  </span>
                  {isEaten && rxn && <span style={{ fontSize: 17, flexShrink: 0 }}>{REACTIONS[rxn]?.icon}</span>}
                  {isCustom && (
                    <button onClick={e => { e.stopPropagation(); removeExtra(food) }} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-light)', fontSize: 16, padding: '0 2px', flexShrink: 0, lineHeight: 1,
                    }}>×</button>
                  )}
                </div>

                {/* Per-food reaction strip */}
                {isEaten && (
                  <div style={{ display: 'flex', gap: 5, padding: '0 16px 10px 50px' }}>
                    {Object.entries(REACTIONS).map(([key, r]) => {
                      const sel = rxn === key
                      return (
                        <button key={key} onClick={() => toggleReaction(food, key)} style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          padding: '3px 9px', borderRadius: 99,
                          border: `1.5px solid ${sel ? r.color : 'var(--border)'}`,
                          background: sel ? r.color + '22' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer', fontFamily: 'var(--font-body)',
                          fontSize: 11, fontWeight: 700,
                          color: sel ? 'var(--text)' : 'var(--text-light)',
                          transition: 'all 0.15s',
                        }}>
                          <span style={{ fontSize: 13 }}>{r.icon}</span>
                          <span>{r.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Inline add food */}
          {addingFood && (
            <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderTop: `1px solid ${borderColor}30` }}>
              <input
                ref={addRef}
                type="text"
                placeholder="Food name…"
                value={addInput}
                onChange={e => setAddInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitAdd()
                  if (e.key === 'Escape') { setAddingFood(false); setAddInput('') }
                }}
                style={{
                  flex: 1, padding: '7px 10px',
                  border: `1.5px solid ${slot.color}`,
                  borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)',
                  fontSize: 13, color: 'var(--text)',
                  background: 'rgba(255,255,255,0.8)', outline: 'none',
                }}
              />
              <button onClick={commitAdd} className="btn btn-primary" style={{ fontSize: 12, padding: '7px 12px', flexShrink: 0 }}>Add</button>
              <button onClick={() => { setAddingFood(false); setAddInput('') }} className="btn btn-ghost" style={{ fontSize: 12, flexShrink: 0 }}>✕</button>
            </div>
          )}

          {/* Notes textarea */}
          {notesOpen && (
            <div style={{ padding: '8px 16px 10px', borderTop: `1px solid ${borderColor}30` }}>
              <textarea
                placeholder="Meal notes — was fussy, tried something new, loved it…"
                value={notes}
                onChange={e => updateNotes(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', boxSizing: 'border-box',
                  border: `1.5px solid ${borderColor}60`, borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)', fontSize: 12, resize: 'vertical',
                  background: 'rgba(255,255,255,0.6)', color: 'var(--text)', minHeight: 52, outline: 'none',
                }}
              />
            </div>
          )}

          {/* Bottom action strip */}
          <div style={{
            display: 'flex', gap: 8, padding: '8px 16px 12px',
            borderTop: `1px solid ${borderColor}20`,
          }}>
            {!addingFood && (
              <button onClick={() => setAddingFood(true)} style={{
                display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                background: 'rgba(255,255,255,0.5)', border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '5px 12px',
                cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--text-light)',
              }}>+ Add food</button>
            )}
            <button onClick={() => setNotesOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              background: notesOpen || notes ? 'rgba(139,111,232,0.1)' : 'rgba(255,255,255,0.5)',
              border: `1.5px solid ${notesOpen || notes ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '5px 12px',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              color: notesOpen || notes ? 'var(--primary)' : 'var(--text-light)',
            }}>📝 {notes ? 'Edit note' : 'Add note'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MPASI banner ─────────────────────────────────────────────
function MPASIBanner({ mpasiInfo, schedEntry, babyDob }) {
  const ref = useRef()
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.set(ref.current, { opacity: 1 })
      gsap.fromTo(ref.current, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)', delay: 0.3 })
    })
    return () => ctx.revert()
  }, [])

  if (!mpasiInfo) return null
  const ageLabel = babyDob ? babyAgeLabel(babyDob) : null

  if (!mpasiInfo.hasStarted) {
    return (
      <div ref={ref} style={{
        marginBottom: 14, padding: '12px 16px',
        background: '#FFF4E0', border: '1.5px solid #FFD4A3', borderRadius: 'var(--radius)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 26 }}>⏳</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#7A4500' }}>MPASI starts in {mpasiInfo.daysUntilStart} days</div>
          {ageLabel && <div style={{ fontSize: 12, color: '#A06020', marginTop: 1 }}>Baby is {ageLabel}</div>}
        </div>
      </div>
    )
  }

  if (!schedEntry) {
    return (
      <div ref={ref} style={{
        marginBottom: 14, padding: '12px 16px',
        background: 'linear-gradient(90deg, #7DD9B8, #A3CCFF)',
        borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 26 }}>🎉</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1A3A30' }}>All {TOTAL_MPASI_WEEKS} weeks completed!</div>
          <div style={{ fontSize: 12, color: '#2A5040', marginTop: 1 }}>You've got this — keep going!</div>
        </div>
      </div>
    )
  }

  const month = Math.ceil(schedEntry.mpasiWeekNum / 4)

  return (
    <div ref={ref} style={{
      marginBottom: 14, padding: '12px 16px',
      background: 'linear-gradient(135deg, rgba(125,217,184,0.15), rgba(163,204,255,0.15))',
      border: '1.5px solid rgba(125,217,184,0.5)', borderRadius: 'var(--radius)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: 'linear-gradient(135deg, #7DD9B8, #A3CCFF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>🌱</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 13, color: 'var(--text)' }}>
          Month {month} · <span style={{ color: 'var(--primary)' }}>{schedEntry.label}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 1 }}>
          {ageLabel && `Baby: ${ageLabel} · `}{mpasiInfo.totalDays + 1} days into MPASI
        </div>
      </div>
    </div>
  )
}

// ─── Progress fill ────────────────────────────────────────────
function ProgressFill({ pct }) {
  const ref = useRef()
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(ref.current, { width: '0%' })
      gsap.fromTo(ref.current, { width: '0%' }, { width: `${pct}%`, duration: 0.8, ease: 'power3.out', delay: 0.3 })
    })
    return () => ctx.revert()
  }, [pct])
  return (
    <div style={{ height: 6, background: 'var(--bg-alt)', borderRadius: 99, overflow: 'hidden' }}>
      <div ref={ref} style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', borderRadius: 99 }} />
    </div>
  )
}

// ─── All done banner ──────────────────────────────────────────
function AllDoneBanner() {
  const ref = useRef()
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(ref.current, { opacity: 1 })
      gsap.fromTo(ref.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)', delay: 0.1 })
    })
    return () => ctx.revert()
  }, [])
  return (
    <div ref={ref} style={{
      marginTop: 8, padding: '20px', textAlign: 'center',
      background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
      borderRadius: 'var(--radius-lg)', color: 'white',
    }}>
      <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>All meals logged!</div>
      <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Great job tracking today's MPASI.</div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const { getPlansForDate, getLogsForDate, logMeal, importTemplateDays } = useFeeding()
  const headerRef = useRef()

  const today   = new Date()
  const plans   = getPlansForDate(today)
  const dayLogs = getLogsForDate(today)

  const mpasiStart = user?.babyDob ? calcMPASIStart(user.babyDob, 6) : null
  const mpasiInfo  = mpasiStart ? getMPASIInfo(mpasiStart, today) : null
  const schedEntry = mpasiStart ? getScheduleEntry(mpasiStart, today, MENU_TEMPLATES) : null

  // Auto-import today's menu on mount if no plan exists yet
  useEffect(() => {
    if (!mpasiStart || !schedEntry?.dayData) return
    const hasPlan = SLOT_KEYS.some(s => (plans[s] || []).length > 0)
    if (!hasPlan) importTemplateDays([{ date: today, dayData: schedEntry.dayData }])
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!headerRef.current) return
    const ctx = gsap.context(() => {
      gsap.set(headerRef.current, { opacity: 1, y: 0 })
      gsap.fromTo(headerRef.current, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
    })
    return () => ctx.revert()
  }, [])

  function handleSave({ slot, ...data }) {
    logMeal({ date: today, slot, ...data })
  }

  const doneLogs = SLOT_KEYS.filter(s => {
    const log = dayLogs.find(l => l.slot === s)
    return log && log.foodsEaten.length > 0
  })
  const allDone   = doneLogs.length === SLOT_KEYS.length
  const currentSlot = getCurrentSlot()

  const h        = today.getHours()
  const greeting = h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  const babyName = user?.babyName || 'Baby'
  const babyAge  = user?.babyDob ? babyAgeLabel(user.babyDob) : null

  return (
    <div>
      {/* Header */}
      <div ref={headerRef} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.2, color: 'var(--text)', marginBottom: 2 }}>
              {greeting}! 👋
            </h2>
            {babyAge && (
              <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                {babyName} is <strong>{babyAge}</strong>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--primary)', fontWeight: 500 }}>
              {doneLogs.length}<span style={{ fontSize: 13, color: 'var(--text-light)', fontFamily: 'var(--font-body)' }}>/{SLOT_KEYS.length}</span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-light)' }}>
              meals done
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', marginBottom: 8 }}>
          {today.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <ProgressFill pct={(doneLogs.length / SLOT_KEYS.length) * 100} />
      </div>

      {/* MPASI banner */}
      {mpasiInfo && <MPASIBanner mpasiInfo={mpasiInfo} schedEntry={schedEntry} babyDob={user?.babyDob} />}

      {/* Meal slot cards */}
      {SLOT_KEYS.map(slotKey => (
        <MealSlotCard
          key={slotKey}
          slotKey={slotKey}
          plannedFoods={plans[slotKey] || []}
          existingLog={dayLogs.find(l => l.slot === slotKey) || null}
          onSave={handleSave}
          isCurrentSlot={slotKey === currentSlot}
        />
      ))}

      {allDone && <AllDoneBanner />}
    </div>
  )
}
