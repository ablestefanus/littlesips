import { useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import { useFeeding } from '../context/FeedingContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  MEAL_SLOTS, SLOT_KEYS, DAYS_SHORT, DAYS_MALAY,
  toDateKey, fromDateKey, isSameDay, getWeekDates,
  getMPASIInfo, calcMPASIStart, getScheduleEntry,
  babyAgeLabel, MPASI_SCHEDULE, TOTAL_MPASI_WEEKS,
} from '../utils.js'
import { MENU_TEMPLATES } from '../data/menuTemplates.js'
import { FOOD_CATEGORIES_BY_MONTH, CATEGORY_ICONS } from '../data/foodCategories.js'

// ─── sub-components ─────────────────────────────────────────
function FoodChip({ food, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: 700, padding: '3px 10px',
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderRadius: 99, color: 'var(--text-mid)',
    }}>
      {food}
      {onRemove && (
        <button onClick={() => onRemove(food)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-light)', fontSize: 13, padding: 0, lineHeight: 1,
        }}>×</button>
      )}
    </span>
  )
}

function SlotEditor({ slotKey, foods, onChange }) {
  const [inputVal, setInputVal] = useState('')
  const slot = MEAL_SLOTS[slotKey]
  function add() {
    const v = inputVal.trim()
    if (v && !foods.includes(v)) onChange([...foods, v])
    setInputVal('')
  }
  return (
    <div style={{
      border: `1.5px solid ${foods.length ? slot.color : 'var(--border)'}`,
      borderRadius: 'var(--radius)', background: foods.length ? slot.bg : 'var(--card)',
      padding: 12, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{slot.icon}</span>
        <span style={{ fontWeight: 800, fontSize: 13, color: slot.color }}>{slot.label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{slot.malay}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: foods.length ? 8 : 0 }}>
        {foods.map(f => <FoodChip key={f} food={f} onRemove={f2 => onChange(foods.filter(x => x !== f2))} />)}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text" placeholder="Add food…" value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          style={{
            flex: 1, padding: '7px 12px', background: 'rgba(255,255,255,0.7)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)', outline: 'none',
          }}
        />
        <button className="btn btn-ghost" style={{ padding: '7px 12px', fontSize: 13 }} onClick={add}>+</button>
      </div>
    </div>
  )
}

// ─── MPASI week badge ────────────────────────────────────────
function MPASIWeekBadge({ schedEntry, babyDob, date }) {
  if (!schedEntry) return null
  const ageLabel = babyDob ? babyAgeLabel(babyDob, date) : null
  const month    = Math.ceil(schedEntry.mpasiWeekNum / 4)
  return (
    <div style={{
      padding: '10px 14px', marginBottom: 12,
      background: 'linear-gradient(90deg, rgba(125,217,184,0.15), rgba(163,204,255,0.15))',
      border: '1.5px solid rgba(125,217,184,0.4)', borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18 }}>🌱</span>
        <span style={{ fontWeight: 900, fontSize: 13, color: 'var(--text)' }}>
          Month {month}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>·</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
          {schedEntry.label}
        </span>
        {ageLabel && (
          <>
            <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--text-mid)', fontWeight: 600 }}>
              Baby: {ageLabel}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Full schedule view ──────────────────────────────────────
function ScheduleWeekRow({ entry, weekDates, isCurrent, isPast, isExpanded, onToggle, onImportDay, babyDob }) {
  const today     = new Date()
  const startDate = weekDates[0]
  const endDate   = weekDates[weekDates.length - 1]
  const month     = Math.ceil(entry.weekNum / 4)
  const template  = MENU_TEMPLATES.find(t => t.id === entry.templateId)
  const ageLabel  = babyDob ? babyAgeLabel(babyDob, startDate) : null

  const dateRangeLabel = `${startDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })} – ${endDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const validDays    = template?.days.filter(d => !d.note) || []
  const daysWithData = weekDates.map(date => {
    const dow         = date.getDay()
    const templateDay = validDays.find(d => d.dayOfWeek === dow)
                     ?? validDays[dow % validDays.length]
                     ?? null
    return { date, templateDay }
  }).filter(({ templateDay }) => templateDay)

  return (
    <div style={{
      borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 8,
      border: isCurrent ? '2px solid var(--primary)' : '1.5px solid var(--border)',
      background: 'var(--card)', opacity: isPast ? 0.72 : 1,
    }}>
      <div onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        cursor: 'pointer',
        background: isCurrent ? 'rgba(139,111,232,0.06)' : 'transparent',
      }}>
        {/* Week badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: isCurrent
            ? 'linear-gradient(135deg, var(--primary), var(--primary-light))'
            : isPast ? 'var(--bg-alt)' : 'var(--bg)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: isCurrent ? 'rgba(255,255,255,0.7)' : 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>M{month}W</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: isCurrent ? 'white' : isPast ? 'var(--text-mid)' : 'var(--text)', lineHeight: 1 }}>{entry.weekNum}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>{entry.label}</span>
            {isCurrent && (
              <span style={{ fontSize: 10, fontWeight: 900, background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>Current</span>
            )}
            {isPast && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-light)' }}>✓</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>
            {dateRangeLabel}
            {ageLabel && <span style={{ marginLeft: 6, color: 'var(--text-light)' }}>· Baby: {ageLabel}</span>}
          </div>
        </div>

        <div style={{ fontSize: 16, color: 'var(--text-light)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</div>
      </div>

      {isExpanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {daysWithData.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-light)', textAlign: 'center', padding: '8px 0' }}>No menu data for this week.</div>
          )}
          {daysWithData.map(({ date, templateDay }) => {
            const isToday = isSameDay(date, today)
            const dow = date.getDay()
            return (
              <div key={toDateKey(date)} style={{
                background: isToday ? 'rgba(139,111,232,0.05)' : 'var(--bg)',
                border: `1px solid ${isToday ? 'var(--primary-light)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 13, color: isToday ? 'var(--primary)' : 'var(--text)' }}>
                      {DAYS_MALAY[dow]}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-light)', marginLeft: 6 }}>
                      {date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                      {isToday && ' · Today'}
                    </span>
                  </div>
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                    onClick={() => onImportDay(date, templateDay)}>
                    📥 Import
                  </button>
                </div>
                {SLOT_KEYS.map(sk => {
                  const foods = templateDay[sk] || []
                  if (!foods.length) return null
                  const slot = MEAL_SLOTS[sk]
                  return (
                    <div key={sk} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 5 }}>
                      <span style={{ fontSize: 14, flexShrink: 0, width: 22 }}>{slot.icon}</span>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: slot.color }}>{slot.label}: </span>
                        <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{foods.join(', ')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FullSchedule({ mpasiStart, currentWeekNum, onImportDay, babyDob }) {
  const [expanded, setExpanded] = useState(currentWeekNum)
  const listRef = useRef()

  useEffect(() => {
    if (!listRef.current) return
    const ctx = gsap.context(() => {
      const els = Array.from(listRef.current.children)
      gsap.set(els, { opacity: 1, y: 0 })
      gsap.fromTo(els, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.025, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [])

  if (!mpasiStart) {
    return (
      <div className="empty-state" style={{ paddingTop: 40 }}>
        <div className="empty-icon">📅</div>
        <div className="empty-title">No start date set</div>
        <div className="empty-text">Add your baby's date of birth in Profile to see the full menu schedule.</div>
      </div>
    )
  }

  const today = new Date()

  function getWeekDatesForEntry(entry) {
    const weekStart = fromDateKey(mpasiStart)
    weekStart.setDate(weekStart.getDate() + (entry.weekNum - 1) * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d
    })
  }

  return (
    <div>
      <div style={{
        padding: '12px 16px', marginBottom: 14,
        background: 'linear-gradient(90deg, rgba(125,217,184,0.15), rgba(163,204,255,0.15))',
        border: '1.5px solid rgba(125,217,184,0.4)', borderRadius: 'var(--radius)',
        fontSize: 13, color: 'var(--text-mid)',
      }}>
        <span style={{ fontWeight: 800, color: 'var(--text)' }}>🌱 {TOTAL_MPASI_WEEKS}-week MPASI schedule</span>
        <br />
        Starting <strong>{mpasiStart}</strong>
        {currentWeekNum && <span style={{ marginLeft: 6, fontWeight: 700, color: 'var(--primary)' }}>· Currently {MPASI_SCHEDULE[currentWeekNum - 1]?.label}</span>}
      </div>

      <div ref={listRef}>
        {MPASI_SCHEDULE.map(entry => {
          const weekDates = getWeekDatesForEntry(entry)
          const weekEnd   = weekDates[weekDates.length - 1]
          const isCurrent = currentWeekNum === entry.weekNum
          const isPast    = weekEnd < today && !isCurrent

          return (
            <ScheduleWeekRow
              key={entry.weekNum}
              entry={entry}
              weekDates={weekDates}
              isCurrent={isCurrent}
              isPast={isPast}
              isExpanded={expanded === entry.weekNum}
              onToggle={() => setExpanded(expanded === entry.weekNum ? null : entry.weekNum)}
              onImportDay={onImportDay}
              babyDob={babyDob}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Food Tracker ────────────────────────────────────────────
function FoodTracker({ mpasiMonth, currentMpasiWeek, mpasiStarted }) {
  const { getFoodEntry, setFoodEntry, getFoodCustom, addCustomFood, removeFood } = useFeeding()
  const [filter, setFilter]         = useState('all')
  const [expandedCats, setExpandedCats] = useState(new Set(['Vegetable', 'Protein', 'Fruits', 'Others']))
  const [noteOpen, setNoteOpen]     = useState(null)
  const [addingTo, setAddingTo]     = useState(null)  // category name currently adding to
  const [addInput, setAddInput]     = useState('')
  const listRef  = useRef()
  const addInputRef = useRef()

  const displayMonth = mpasiMonth || 1
  const categories   = FOOD_CATEGORIES_BY_MONTH[displayMonth] || FOOD_CATEGORIES_BY_MONTH[1]

  useEffect(() => {
    if (!listRef.current) return
    const ctx = gsap.context(() => {
      const els = Array.from(listRef.current.children)
      gsap.set(els, { opacity: 1, y: 0 })
      gsap.fromTo(els, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.07, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [displayMonth])

  useEffect(() => {
    if (addingTo) addInputRef.current?.focus()
  }, [addingTo])

  function toggleFood(food) {
    const entry = getFoodEntry(food)
    const nowTried = !entry.tried
    setFoodEntry(food, {
      tried: nowTried,
      mpasiWeek: nowTried ? (currentMpasiWeek || entry.mpasiWeek || null) : entry.mpasiWeek,
    })
  }

  function toggleCat(cat) {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function commitAdd(category) {
    const v = addInput.trim()
    if (v) addCustomFood(displayMonth, category, v)
    setAddInput('')
    setAddingTo(null)
  }

  function handleRemove(category, food, isCustom) {
    removeFood(displayMonth, category, food, isCustom)
    // clear tracker entry if it exists
    setFoodEntry(food, { tried: false, mpasiWeek: null, notes: '' })
  }

  return (
    <div>
      {/* Header + filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
            🌱 {mpasiStarted ? `Month ${displayMonth} Food List` : 'Preview · Month 1 Foods'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', marginTop: 1 }}>
            {mpasiStarted ? 'Tick foods tried · + to add · × to remove' : 'MPASI not started — showing Month 1 as preview'}
          </div>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-alt)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2 }}>
          {[['all', 'All foods'], ['tobuy', '🛒 To buy']].map(([v, label]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              padding: '5px 10px', fontSize: 11, fontWeight: 700, borderRadius: 5,
              border: 'none', cursor: 'pointer',
              background: filter === v ? 'var(--card)' : 'transparent',
              color: filter === v ? 'var(--primary)' : 'var(--text-mid)',
              boxShadow: filter === v ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div ref={listRef}>
        {categories.map(({ category, foods: baseFoods }) => {
          const custom     = getFoodCustom(displayMonth, category)
          const allFoods   = [...baseFoods.filter(f => !(custom.hidden || []).includes(f)), ...custom.added]
          const triedCount = allFoods.filter(f => getFoodEntry(f).tried).length
          const visibleFoods = filter === 'tobuy' ? allFoods.filter(f => !getFoodEntry(f).tried) : allFoods
          const isExpanded = expandedCats.has(category)
          if (filter === 'tobuy' && visibleFoods.length === 0 && addingTo !== category) return null

          return (
            <div key={category} style={{
              background: 'var(--card)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius)', marginBottom: 10, overflow: 'hidden',
            }}>
              {/* Category header */}
              <div onClick={() => toggleCat(category)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', cursor: 'pointer',
                background: isExpanded ? 'rgba(139,111,232,0.04)' : 'transparent',
              }}>
                <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[category]}</span>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', flex: 1 }}>{category}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: triedCount === allFoods.length && allFoods.length > 0 ? '#2A7A50' : 'var(--text-light)' }}>
                  {triedCount}/{allFoods.length}
                </span>
                <span style={{
                  fontSize: 14, color: 'var(--text-light)', flexShrink: 0,
                  transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none',
                }}>▾</span>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {visibleFoods.length === 0 && addingTo !== category && (
                    <div style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-light)' }}>
                      All {category.toLowerCase()} foods tried! 🎉
                    </div>
                  )}

                  {visibleFoods.map((food, idx) => {
                    const entry      = getFoodEntry(food)
                    const isNoteOpen = noteOpen === food
                    const isCustom   = custom.added.includes(food)
                    const isLast     = idx === visibleFoods.length - 1 && addingTo !== category
                    return (
                      <div key={food} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
                          {/* Checkbox */}
                          <button onClick={() => toggleFood(food)} style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            border: `2px solid ${entry.tried ? '#7DD9B8' : 'var(--border)'}`,
                            background: entry.tried ? '#7DD9B8' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}>
                            {entry.tried && <span style={{ fontSize: 11, color: 'white', fontWeight: 900 }}>✓</span>}
                          </button>

                          {/* Food name */}
                          <span style={{
                            flex: 1, fontSize: 13, fontWeight: 600,
                            color: entry.tried ? 'var(--text-mid)' : 'var(--text)',
                          }}>
                            {food}
                            {isCustom && <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 800, color: 'var(--primary)', background: 'rgba(139,111,232,0.1)', padding: '1px 5px', borderRadius: 99 }}>custom</span>}
                          </span>

                          {/* Week pill */}
                          {entry.tried && entry.mpasiWeek && (
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '2px 8px',
                              background: 'rgba(125,217,184,0.2)', border: '1px solid rgba(125,217,184,0.5)',
                              borderRadius: 99, color: '#2A7A50', whiteSpace: 'nowrap', flexShrink: 0,
                            }}>Wk {entry.mpasiWeek}</span>
                          )}

                          {/* Note button */}
                          <button onClick={() => setNoteOpen(isNoteOpen ? null : food)} style={{
                            background: isNoteOpen || entry.notes ? 'rgba(139,111,232,0.1)' : 'transparent',
                            border: 'none', cursor: 'pointer', fontSize: 14,
                            padding: '2px 5px', borderRadius: 6, flexShrink: 0,
                            color: entry.notes ? 'var(--primary)' : 'var(--text-light)',
                          }}>📝</button>

                          {/* Delete button */}
                          <button onClick={() => handleRemove(category, food, isCustom)} style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            fontSize: 14, padding: '2px 5px', borderRadius: 6, flexShrink: 0,
                            color: 'var(--text-light)', lineHeight: 1,
                          }} title="Remove food">×</button>
                        </div>

                        {/* Note textarea */}
                        {isNoteOpen && (
                          <div style={{ padding: '0 16px 10px 48px' }}>
                            <textarea
                              autoFocus
                              placeholder="Notes — e.g. slight rash, try again later…"
                              value={entry.notes}
                              onChange={e => setFoodEntry(food, { notes: e.target.value })}
                              style={{
                                width: '100%', padding: '8px 10px', boxSizing: 'border-box',
                                border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                                fontFamily: 'var(--font-body)', fontSize: 12, resize: 'vertical',
                                background: 'var(--bg)', color: 'var(--text)', minHeight: 60, outline: 'none',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Add food row */}
                  {addingTo === category ? (
                    <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderTop: visibleFoods.length ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                      <input
                        ref={addInputRef}
                        type="text"
                        placeholder={`New ${category.toLowerCase()} name…`}
                        value={addInput}
                        onChange={e => setAddInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitAdd(category)
                          if (e.key === 'Escape') { setAddingTo(null); setAddInput('') }
                        }}
                        style={{
                          flex: 1, padding: '7px 10px',
                          border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)',
                          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text)',
                          background: 'var(--bg)', outline: 'none',
                        }}
                      />
                      <button onClick={() => commitAdd(category)} className="btn btn-primary" style={{ fontSize: 12, padding: '7px 12px', flexShrink: 0 }}>Add</button>
                      <button onClick={() => { setAddingTo(null); setAddInput('') }} className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 10px', flexShrink: 0 }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 16px', borderTop: visibleFoods.length ? '1px solid var(--border)' : 'none' }}>
                      <button
                        onClick={() => { setAddingTo(category); setAddInput('') }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: 'none', border: '1.5px dashed var(--border)',
                          borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer',
                          fontSize: 12, fontWeight: 700, color: 'var(--text-light)', width: '100%',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add food to {category}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Menu page ───────────────────────────────────────────
export default function Menu() {
  const { user } = useAuth()
  const { getPlansForDate, setPlanSlot, deletePlanSlot, importTemplateDay, importTemplateDays } = useFeeding()
  const [view, setView]             = useState('weekly')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelected] = useState(new Date())
  const [editing, setEditing]       = useState(false)
  const [draftFoods, setDraftFoods] = useState({})
  const pageRef  = useRef()
  const cardsRef = useRef()

  const weekDates  = getWeekDates(weekOffset)
  const today      = new Date()
  const selKey     = toDateKey(selectedDate)
  const plans      = getPlansForDate(selectedDate)
  const mpasiStart = user?.babyDob ? calcMPASIStart(user.babyDob, 6) : null

  // Schedule entry for selected date
  const schedEntry = mpasiStart ? getScheduleEntry(mpasiStart, selectedDate, MENU_TEMPLATES) : null

  // Current MPASI week (today)
  const todayMpasiInfo  = mpasiStart ? getMPASIInfo(mpasiStart, today) : null
  const currentWeekNum  = todayMpasiInfo?.hasStarted ? Math.min(todayMpasiInfo.week, TOTAL_MPASI_WEEKS) : null

  // ── Auto-import: fill any day in the visible week that has no plan (batched) ──
  const weekKey = weekDates.map(d => toDateKey(d)).join(',')
  useEffect(() => {
    if (!mpasiStart) return
    const toImport = []
    weekDates.forEach(date => {
      const entry = getScheduleEntry(mpasiStart, date, MENU_TEMPLATES)
      if (!entry?.dayData) return
      const existing = getPlansForDate(date)
      const hasPlan  = SLOT_KEYS.some(s => (existing[s] || []).length > 0)
      if (!hasPlan) toImport.push({ date, dayData: entry.dayData })
    })
    if (toImport.length > 0) importTemplateDays(toImport)
  }, [weekKey, mpasiStart])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = Array.from(pageRef.current?.children || [])
      gsap.set(els, { opacity: 1, y: 0 })
      gsap.fromTo(els, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.07, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!cardsRef.current) return
    const ctx = gsap.context(() => {
      const els = Array.from(cardsRef.current?.children || [])
      gsap.set(els, { opacity: 1, y: 0 })
      gsap.fromTo(els, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, stagger: 0.05, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [selKey])

  function startEdit() {
    const draft = {}
    SLOT_KEYS.forEach(s => { draft[s] = [...(plans[s] || [])] })
    setDraftFoods(draft)
    setEditing(true)
  }

  function saveEdit() {
    SLOT_KEYS.forEach(s => {
      if (draftFoods[s]?.length) setPlanSlot(selectedDate, s, draftFoods[s])
      else deletePlanSlot(selectedDate, s)
    })
    setEditing(false)
  }

  function handleScheduleImport(date, templateDay) {
    importTemplateDay(date, templateDay)
    navigateToDate(date)
    setView('weekly')
  }

  function navigateToDate(date) {
    const todayMon = new Date(today)
    todayMon.setDate(today.getDate() - today.getDay())
    todayMon.setHours(0, 0, 0, 0)
    const targetMon = new Date(date)
    targetMon.setDate(date.getDate() - date.getDay())
    targetMon.setHours(0, 0, 0, 0)
    const offset = Math.round((targetMon - todayMon) / (7 * 86400000))
    setWeekOffset(offset)
    setSelected(date)
  }

  function jumpToMpasiStart() {
    if (!mpasiStart) return
    navigateToDate(fromDateKey(mpasiStart))
  }

  const hasPlan = SLOT_KEYS.some(s => (plans[s] || []).length > 0)

  return (
    <div ref={pageRef}>
      {/* Header + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>Menu</h2>
        <div style={{ display: 'flex', background: 'var(--bg-alt)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2 }}>
          {[['weekly', '📅 Weekly'], ['schedule', '📋 Schedule'], ['foods', '🛒 Foods']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 10px', fontSize: 11, fontWeight: 700, borderRadius: 6,
              border: 'none', cursor: 'pointer',
              background: view === v ? 'var(--card)' : 'transparent',
              color: view === v ? 'var(--primary)' : 'var(--text-mid)',
              boxShadow: view === v ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Full Schedule view ── */}
      {view === 'schedule' && (
        <FullSchedule
          mpasiStart={mpasiStart}
          currentWeekNum={currentWeekNum}
          onImportDay={handleScheduleImport}
          babyDob={user?.babyDob}
        />
      )}

      {/* ── Food Tracker view ── */}
      {view === 'foods' && (
        <FoodTracker
          mpasiMonth={currentWeekNum ? Math.ceil(currentWeekNum / 4) : null}
          currentMpasiWeek={currentWeekNum}
          mpasiStarted={!!todayMpasiInfo?.hasStarted}
        />
      )}

      {/* ── Weekly view ── */}
      {view === 'weekly' && (
        <>
          {/* Week nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', margin: 0 }}>
              {weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : `${weekOffset > 0 ? '+' : ''}${weekOffset} weeks`}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-icon" onClick={() => { setWeekOffset(o => o - 1); setSelected(getWeekDates(weekOffset - 1)[0]) }}>‹</button>
              <button className="btn btn-icon" onClick={() => { setWeekOffset(o => o + 1); setSelected(getWeekDates(weekOffset + 1)[0]) }}>›</button>
            </div>
          </div>

          {/* Day chips */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {weekDates.map((d, i) => {
              const isToday = isSameDay(d, today)
              const isSel   = isSameDay(d, selectedDate)
              const dayEntry = mpasiStart ? getScheduleEntry(mpasiStart, d, MENU_TEMPLATES) : null
              return (
                <button key={i} onClick={() => { setSelected(d); setEditing(false) }} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${isSel ? 'var(--primary)' : isToday ? 'var(--primary-light)' : 'var(--border)'}`,
                  background: isSel ? 'var(--primary)' : isToday ? 'var(--bg-alt)' : 'var(--card)',
                  cursor: 'pointer', minWidth: 44, transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: isSel ? 'rgba(255,255,255,0.8)' : 'var(--text-light)' }}>
                    {DAYS_SHORT[d.getDay()]}
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: isSel ? 'white' : 'var(--text)', marginTop: 1 }}>
                    {d.getDate()}
                  </span>
                  {/* Dot indicator if this day has a template */}
                  {dayEntry?.dayData && (
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.6)' : 'var(--primary)', marginTop: 3 }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* MPASI week badge for selected date */}
          {schedEntry ? (
            <MPASIWeekBadge schedEntry={schedEntry} babyDob={user?.babyDob} date={selectedDate} />
          ) : mpasiStart && todayMpasiInfo && !todayMpasiInfo.hasStarted ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              padding: '10px 14px', marginBottom: 12,
              background: '#FFF4E0', border: '1px solid #FFD4A3', borderRadius: 'var(--radius-sm)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#7A4500' }}>
                  ⏳ MPASI starts in {todayMpasiInfo.daysUntilStart} days
                </div>
                <div style={{ fontSize: 11, color: '#A06020', marginTop: 2 }}>
                  {mpasiStart}
                </div>
              </div>
              <button
                className="btn"
                onClick={jumpToMpasiStart}
                style={{
                  fontSize: 12, padding: '7px 14px', flexShrink: 0,
                  background: '#7A4500', color: 'white', border: 'none',
                  borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Jump to start →
              </button>
            </div>
          ) : !mpasiStart ? (
            <div style={{ padding: '10px 14px', marginBottom: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-mid)' }}>
              💡 Add your baby's date of birth in <strong>Profile</strong> to auto-load menus.
            </div>
          ) : null}

          {/* Selected day header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--text)' }}>
                {DAYS_MALAY[selectedDate.getDay()]} ({DAYS_SHORT[selectedDate.getDay()]})
                {isSameDay(selectedDate, today) && <span style={{ color: 'var(--primary)', marginLeft: 6, fontSize: 12 }}>· Today</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)' }}>
                {selectedDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {!editing && <button className="btn btn-outline" style={{ fontSize: 12, padding: '8px 12px' }} onClick={startEdit}>✏️ Edit</button>}
              {editing && (
                <>
                  <button className="btn btn-primary" style={{ fontSize: 12, padding: '8px 14px' }} onClick={saveEdit}>Save</button>
                  <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditing(false)}>Cancel</button>
                </>
              )}
            </div>
          </div>

          {/* Day content */}
          <div ref={cardsRef}>
            {editing ? (
              SLOT_KEYS.map(sk => (
                <SlotEditor key={sk} slotKey={sk} foods={draftFoods[sk] || []}
                  onChange={foods => setDraftFoods(d => ({ ...d, [sk]: foods }))} />
              ))
            ) : hasPlan ? (
              SLOT_KEYS.map(sk => {
                const foods = plans[sk] || []
                const slot  = MEAL_SLOTS[sk]
                if (!foods.length) return null
                return (
                  <div key={sk} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    background: slot.bg, border: `1.5px solid ${slot.color}30`,
                    borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 8,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, background: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}>{slot.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: slot.color, marginBottom: 6 }}>
                        {slot.label}
                        <span style={{ color: 'var(--text-light)', fontSize: 11, fontWeight: 600, marginLeft: 6 }}>{slot.malay}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {foods.map(f => <FoodChip key={f} food={f} />)}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state" style={{ paddingTop: 32 }}>
                <div className="empty-icon">📋</div>
                <div className="empty-title">No menu for this day</div>
                <div className="empty-text">No MPASI menu available for this date's day of the week, or MPASI hasn't started yet.</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" onClick={() => setView('schedule')}>📋 View schedule</button>
                  <button className="btn btn-ghost" onClick={startEdit}>✏️ Add manually</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
