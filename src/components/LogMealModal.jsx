import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { MEAL_SLOTS, REACTIONS } from '../utils.js'

export default function LogMealModal({ isOpen, onClose, onSave, slot, date, plannedFoods = [], existingLog = null }) {
  const overlayRef = useRef()
  const sheetRef   = useRef()
  const inputRef   = useRef()

  const slotInfo = MEAL_SLOTS[slot] || MEAL_SLOTS.breakfast

  const [checked, setChecked]           = useState({})
  const [extra, setExtra]               = useState([])
  const [inputVal, setInputVal]         = useState('')
  const [foodReactions, setFoodReactions] = useState({})
  const [notes, setNotes]               = useState('')

  useEffect(() => {
    if (!isOpen) return
    const base = {}
    if (existingLog) {
      plannedFoods.forEach(f => { base[f] = existingLog.foodsEaten.includes(f) })
      setExtra(existingLog.foodsEaten.filter(f => !plannedFoods.includes(f)))
      setNotes(existingLog.notes || '')
      // Support both new per-food and old single-reaction format
      if (existingLog.foodReactions) {
        setFoodReactions(existingLog.foodReactions)
      } else if (existingLog.reaction) {
        const fr = {}
        existingLog.foodsEaten.forEach(f => { fr[f] = existingLog.reaction })
        setFoodReactions(fr)
      } else {
        setFoodReactions({})
      }
    } else {
      plannedFoods.forEach(f => { base[f] = false })
      setExtra([])
      setFoodReactions({})
      setNotes('')
    }
    setChecked(base)
    setInputVal('')

    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22 })
      gsap.fromTo(sheetRef.current,   { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, ease: 'back.out(1.5)' })
    })
    return () => ctx.revert()
  }, [isOpen, slot])

  function handleClose() {
    gsap.to(sheetRef.current,   { y: 60, opacity: 0, duration: 0.2, ease: 'power2.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: onClose })
  }

  function addExtra() {
    const val = inputVal.trim()
    if (!val) return
    if (!extra.includes(val) && !plannedFoods.includes(val)) {
      setExtra(e => [...e, val])
      setChecked(c => ({ ...c, [val]: true }))
    }
    setInputVal('')
  }

  function removeExtra(food) {
    setExtra(e => e.filter(f => f !== food))
    setChecked(c => { const n = { ...c }; delete n[food]; return n })
  }

  function setFoodReaction(food, key) {
    setFoodReactions(prev => ({ ...prev, [food]: prev[food] === key ? null : key }))
  }

  function handleSave() {
    const allFoods = [...plannedFoods, ...extra]
    const eaten    = allFoods.filter(f => checked[f])
    // Compute dominant reaction for backward-compat display (most common among eaten foods)
    const counts = {}
    eaten.forEach(f => { const r = foodReactions[f]; if (r) counts[r] = (counts[r] || 0) + 1 })
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    gsap.to(sheetRef.current, { scale: 0.98, duration: 0.08, yoyo: true, repeat: 1,
      onComplete: () => {
        onSave({ foodsEaten: eaten, plannedFoods, reaction: dominant, foodReactions, notes })
        handleClose()
      }
    })
  }

  if (!isOpen) return null

  const allFoods = [...plannedFoods, ...extra]
  const eatenCount = allFoods.filter(f => checked[f]).length

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => e.target === overlayRef.current && handleClose()}>
      <div className="modal-sheet" ref={sheetRef}>
        <div className="modal-handle" />

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: slotInfo.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22,
            }}>
              {slotInfo.icon}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--text)' }}>{slotInfo.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>{slotInfo.malay} · {
                typeof date === 'object'
                  ? date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
                  : date
              }</div>
            </div>
          </div>
          <button className="btn btn-icon" onClick={handleClose}>✕</button>
        </div>

        <div className="modal-body" style={{ paddingBottom: 8 }}>
          {/* Foods checklist */}
          {allFoods.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-light)', marginBottom: 10 }}>
                What was eaten? ({eatenCount}/{allFoods.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allFoods.map(food => (
                  <div key={food} style={{
                    background: checked[food] ? slotInfo.bg : 'var(--bg)',
                    border: `1.5px solid ${checked[food] ? slotInfo.color : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    transition: 'all 0.15s', overflow: 'hidden',
                  }}>
                    {/* Food row */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!checked[food]}
                        onChange={e => {
                          setChecked(c => ({ ...c, [food]: e.target.checked }))
                          if (!e.target.checked) setFoodReactions(prev => { const n = { ...prev }; delete n[food]; return n })
                        }}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        border: `2px solid ${checked[food] ? slotInfo.color : 'var(--border)'}`,
                        background: checked[food] ? slotInfo.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.15s',
                      }}>
                        {checked[food] && <span style={{ color: 'white', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: checked[food] ? 'var(--text)' : 'var(--text-mid)', flex: 1 }}>{food}</span>
                      {/* Selected reaction badge */}
                      {checked[food] && foodReactions[food] && (
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{REACTIONS[foodReactions[food]]?.icon}</span>
                      )}
                      {extra.includes(food) && (
                        <button onClick={e => { e.preventDefault(); removeExtra(food) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: 14, padding: 2, flexShrink: 0 }}>
                          ✕
                        </button>
                      )}
                    </label>
                    {/* Per-food reaction strip — shown when food is checked */}
                    {checked[food] && (
                      <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px 48px' }}>
                        {Object.entries(REACTIONS).map(([key, r]) => {
                          const isSelected = foodReactions[food] === key
                          return (
                            <button
                              key={key}
                              onClick={() => setFoodReaction(food, key)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', borderRadius: 99,
                                border: `1.5px solid ${isSelected ? r.color : 'var(--border)'}`,
                                background: isSelected ? r.color + '22' : 'var(--bg)',
                                cursor: 'pointer', fontFamily: 'var(--font-body)',
                                fontSize: 11, fontWeight: 700,
                                color: isSelected ? 'var(--text)' : 'var(--text-light)',
                                transition: 'all 0.15s', flexShrink: 0,
                              }}
                            >
                              <span style={{ fontSize: 14 }}>{r.icon}</span>
                              <span>{r.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0 8px', color: 'var(--text-mid)', fontSize: 14 }}>
              No planned foods. Add what was eaten below.
            </div>
          )}

          {/* Add extra food */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Add a food item…"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addExtra()}
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--bg)', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)',
                fontSize: 14, color: 'var(--text)', outline: 'none',
              }}
            />
            <button className="btn btn-outline" style={{ padding: '10px 16px', flexShrink: 0 }} onClick={addExtra}>
              Add
            </button>
          </div>

          {/* Notes */}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Notes <span style={{ color: 'var(--text-light)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <textarea
              placeholder="Any observations — tried something new, was fussy, loved it…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ minHeight: 64 }}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            onClick={handleSave}
            disabled={eatenCount === 0 && extra.length === 0 && !notes}
          >
            {eatenCount > 0
              ? `Save — ${eatenCount} food${eatenCount !== 1 ? 's' : ''} eaten`
              : 'Save meal'}
          </button>
        </div>
      </div>
    </div>
  )
}
