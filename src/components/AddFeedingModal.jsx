import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { FEEDING_TYPES } from '../utils.js'

const DEFAULTS = {
  breast_left:  45,
  breast_right: 45,
  formula:      120,
  pumped:       100,
  water:        30,
  solid:        60,
}

const PRESETS = {
  breast_left:  [5, 10, 15, 20, 30, 45],
  breast_right: [5, 10, 15, 20, 30, 45],
  formula:      [30, 60, 90, 120, 150, 180],
  pumped:       [30, 60, 90, 120, 150, 180],
  water:        [10, 20, 30, 50, 80, 100],
  solid:        [20, 40, 60, 80, 100, 120],
}

function toLocalDatetimeString(date = new Date()) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AddFeedingModal({ isOpen, onClose, onSave, prefill }) {
  const overlayRef = useRef()
  const sheetRef = useRef()
  const [type, setType]     = useState('breast_left')
  const [amount, setAmount] = useState(DEFAULTS.breast_left)
  const [time, setTime]     = useState(toLocalDatetimeString())
  const [notes, setNotes]   = useState('')
  const [saving, setSaving] = useState(false)

  const typeInfo = FEEDING_TYPES[type]
  const max = typeInfo?.isTime ? 120 : 300

  useEffect(() => {
    if (isOpen) {
      setTime(toLocalDatetimeString())
      if (prefill) {
        if (prefill.type) setType(prefill.type)
        if (prefill.amount) setAmount(prefill.amount)
        if (prefill.notes) setNotes(prefill.notes)
      } else {
        setType('breast_left')
        setAmount(DEFAULTS.breast_left)
        setNotes('')
      }
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22 })
      gsap.fromTo(sheetRef.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, ease: 'back.out(1.5)' })
    }
  }, [isOpen])

  useEffect(() => {
    setAmount(DEFAULTS[type] || 60)
  }, [type])

  function handleClose() {
    gsap.to(sheetRef.current, { y: 60, opacity: 0, duration: 0.22, ease: 'power2.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.22, onComplete: onClose })
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    const isoTime = new Date(time).toISOString()
    onSave({ type, amount: Number(amount), startTime: isoTime, notes })

    const btn = sheetRef.current?.querySelector('.save-btn')
    if (btn) {
      gsap.timeline()
        .to(btn, { scale: 0.95, duration: 0.1 })
        .to(btn, { scale: 1.05, duration: 0.15, ease: 'back.out(3)' })
        .to(btn, { scale: 1, duration: 0.1 })
    }
    await new Promise(r => setTimeout(r, 400))
    setSaving(false)
    handleClose()
    setNotes('')
    setType('breast_left')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => e.target === overlayRef.current && handleClose()}>
      <div className="modal-sheet" ref={sheetRef}>
        <div className="modal-handle" />

        <div className="modal-header">
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>Log a Feeding</div>
            <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 2 }}>What did the little one have?</div>
          </div>
          <button className="btn btn-icon" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {/* Feeding Type */}
          <div className="field">
            <label>Type of Feed</label>
            <div className="type-grid">
              {Object.entries(FEEDING_TYPES).map(([key, info]) => (
                <button
                  key={key}
                  className={`type-btn ${type === key ? 'selected' : ''}`}
                  onClick={() => setType(key)}
                  style={type === key ? { borderColor: info.color, background: info.bg } : {}}
                >
                  <span className="type-emoji">{info.emoji}</span>
                  <span className="type-info">
                    <span className="type-name">{info.label}</span>
                    <span className="type-unit">{info.unitFull}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount / Duration */}
          <div className="field">
            <label>{typeInfo?.isTime ? 'Duration' : 'Amount'}</label>
            <div className="amount-row">
              <div className="amount-display">
                {amount}<small> {typeInfo?.unit}</small>
              </div>
              <input
                type="range"
                min={typeInfo?.isTime ? 1 : 5}
                max={max}
                step={typeInfo?.isTime ? 1 : 5}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, ${typeInfo?.color} ${(amount / max) * 100}%, var(--bg-alt) ${(amount / max) * 100}%)`
                }}
              />
            </div>
            {/* Quick presets */}
            <div className="chip-group" style={{ marginTop: 10 }}>
              {(PRESETS[type] || []).map(p => (
                <button
                  key={p}
                  className={`chip ${amount === p ? 'active' : ''}`}
                  onClick={() => setAmount(p)}
                  style={amount === p ? { borderColor: typeInfo?.color, color: typeInfo?.color } : {}}
                >
                  {p}{typeInfo?.unit}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="field">
            <label>When</label>
            <input
              type="datetime-local"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="field">
            <label>Notes <span style={{ color: 'var(--text-light)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea
              placeholder="Any observations — was baby fussy, sleepy, alert…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary btn-lg save-btn"
            style={{ width: '100%' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '✓ Saved!' : `Save — ${FEEDING_TYPES[type]?.emoji} ${amount}${FEEDING_TYPES[type]?.unit}`}
          </button>
        </div>
      </div>
    </div>
  )
}
