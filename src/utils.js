export const MEAL_SLOTS = {
  breakfast: { label: 'Breakfast',  malay: 'Sarapan',          icon: '🌅', color: '#FFB86B', bg: '#FFF4E0', time: '07:00' },
  teatime1:  { label: 'Tea-time',   malay: 'Minum Pagi',       icon: '🍵', color: '#A3CCFF', bg: '#EBF4FF', time: '10:00' },
  lunch:     { label: 'Lunch',      malay: 'Tengahari',         icon: '🍽️', color: '#7DD9B8', bg: '#E0FAF1', time: '12:00' },
  teatime2:  { label: 'Tea-time',   malay: 'Minum Petang',     icon: '🫖', color: '#F5A0B5', bg: '#FFF0F5', time: '15:00' },
  dinner:    { label: 'Dinner',     malay: 'Makan Malam',      icon: '🌙', color: '#8B6FE8', bg: '#F0ECFF', time: '18:00' },
}

export const SLOT_KEYS = Object.keys(MEAL_SLOTS)

export const REACTIONS = {
  loved:   { label: 'Loved it!',  icon: '😍', color: '#7DD9B8' },
  ok:      { label: 'It was ok',  icon: '😐', color: '#FFB86B' },
  refused: { label: 'Refused',    icon: '😤', color: '#F5A0B5' },
}

export const MALAY_DAYS = {
  'ISNIN': 1, 'SELASA': 2, 'RABU': 3, 'KHAMIS': 4, 'JUMAAT': 5, 'SABTU': 6, 'AHAD': 0,
}
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAYS_MALAY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu']
export const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── MPASI week schedule ────────────────────────────────────
// Maps each MPASI week number to a template ID and a human label.
// feb_week_1-4 is the same food repeated for 4 weeks; april_week_3 is
// placed in natural order (was last in the docx file list).
export const MPASI_SCHEDULE = [
  { weekNum: 1,  label: 'Feb Week 1',   templateId: 'feb_week_1-4'  },
  { weekNum: 2,  label: 'Feb Week 2',   templateId: 'feb_week_1-4'  },
  { weekNum: 3,  label: 'Feb Week 3',   templateId: 'feb_week_1-4'  },
  { weekNum: 4,  label: 'Feb Week 4',   templateId: 'feb_week_1-4'  },
  { weekNum: 5,  label: 'Feb Week 5',   templateId: 'feb_week_5'    },
  { weekNum: 6,  label: 'March Week 1', templateId: 'march_week_1'  },
  { weekNum: 7,  label: 'March Week 2', templateId: 'march_week_2'  },
  { weekNum: 8,  label: 'March Week 3', templateId: 'march_week_3'  },
  { weekNum: 9,  label: 'March Week 4', templateId: 'march_week_4'  },
  { weekNum: 10, label: 'April Week 1', templateId: 'april_week_1'  },
  { weekNum: 11, label: 'April Week 2', templateId: 'april_week_2'  },
  { weekNum: 12, label: 'April Week 3', templateId: 'april_week_3'  },
  { weekNum: 13, label: 'April Week 4', templateId: 'april_week_4'  },
  { weekNum: 14, label: 'April Week 5', templateId: 'april_week_5'  },
  { weekNum: 15, label: 'May Week 1',   templateId: 'may_week_1'    },
  { weekNum: 16, label: 'May Week 2',   templateId: 'may_week_2'    },
  { weekNum: 17, label: 'May Week 3',   templateId: 'may_week_3'    },
  { weekNum: 18, label: 'May Week 4',   templateId: 'may_week_4'    },
  { weekNum: 19, label: 'June Week 1',  templateId: 'june_week_1'   },
  { weekNum: 20, label: 'Aug Week 1',   templateId: 'august_week_1' },
  { weekNum: 21, label: 'Aug Week 2',   templateId: 'august_week_2' },
  { weekNum: 22, label: 'Aug Week 3',   templateId: 'august_week_3' },
  { weekNum: 23, label: 'Aug Week 4',   templateId: 'august_week_4' },
  { weekNum: 24, label: 'Sept Week 1',  templateId: 'sept_week_1'   },
  { weekNum: 25, label: 'Sept Week 2',  templateId: 'sept_week_2'   },
  { weekNum: 26, label: 'Sept Week 3',  templateId: 'sept_week_3'   },
  { weekNum: 27, label: 'Sept Week 4',  templateId: 'sept_week_4'   },
  { weekNum: 28, label: 'Oct Week 1',   templateId: 'oct_week_1'    },
  { weekNum: 29, label: 'Oct Week 2',   templateId: 'oct_week_2'    },
  { weekNum: 30, label: 'Oct Week 3',   templateId: 'oct_week_3'    },
  { weekNum: 31, label: 'Oct Week 4',   templateId: 'oct_week_4'    },
]

export const TOTAL_MPASI_WEEKS = MPASI_SCHEDULE.length  // 31

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function toDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function formatDate(dateOrKey) {
  const d = typeof dateOrKey === 'string' && dateOrKey.match(/^\d{4}-\d{2}-\d{2}$/)
    ? fromDateKey(dateOrKey)
    : new Date(dateOrKey)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (isSameDay(d, today)) return 'Today'
  if (isSameDay(d, yesterday)) return 'Yesterday'
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatTime(iso) {
  const d = new Date(iso)
  let h = d.getHours(), m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(m).padStart(2,'0')} ${ampm}`
}

export function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${(diff / 3600).toFixed(1)}h ago`
  return formatDate(iso)
}

export function getWeekDates(weekOffset = 0) {
  const today = new Date()
  const dow   = today.getDay()
  const start = new Date(today)
  start.setDate(today.getDate() - dow + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d
  })
}

// babyAgeLabel optionally accepts a reference date to compute age at a past/future point
export function babyAgeLabel(dob, refDate = new Date()) {
  if (!dob) return null
  const birth = new Date(dob + 'T00:00:00')
  const now   = refDate instanceof Date ? refDate : fromDateKey(refDate)
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
  if (months < 1) {
    const days = Math.floor((now - birth) / 86400000)
    return `${days} day${days !== 1 ? 's' : ''} old`
  }
  if (months < 24) return `${months} month${months !== 1 ? 's' : ''} old`
  const years = Math.floor(months / 12)
  const rem   = months % 12
  return rem > 0 ? `${years}y ${rem}m old` : `${years} year${years !== 1 ? 's' : ''} old`
}

// ── MPASI helpers ──────────────────────────────────────────

export function calcMPASIStart(dob, offsetMonths = 6) {
  if (!dob) return null
  const d = new Date(dob + 'T00:00:00')
  d.setMonth(d.getMonth() + offsetMonths)
  return toDateKey(d)
}

export function babyAgeMonths(dob, onDate = new Date()) {
  if (!dob) return null
  const birth = new Date(dob + 'T00:00:00')
  const on    = new Date(typeof onDate === 'string' ? onDate + 'T00:00:00' : onDate)
  return (on.getFullYear() - birth.getFullYear()) * 12 + on.getMonth() - birth.getMonth()
}

// Returns { hasStarted, week (1-based, maps to MPASI_SCHEDULE index), month, totalDays, daysUntilStart }
export function getMPASIInfo(mpasiStartDate, targetDate = new Date()) {
  if (!mpasiStartDate) return null
  const start  = new Date(mpasiStartDate + 'T00:00:00')
  const target = new Date(typeof targetDate === 'string' ? targetDate + 'T00:00:00' : targetDate)
  const diffMs = target - start
  if (diffMs < 0) {
    return { hasStarted: false, daysUntilStart: Math.ceil(-diffMs / 86400000) }
  }
  const totalDays = Math.floor(diffMs / 86400000)
  const week      = Math.floor(totalDays / 7) + 1      // 1-based MPASI week
  const month     = Math.ceil(week / 4)                 // 4-week months
  return { hasStarted: true, week, month, totalDays }
}

// Given a baby DOB, mpasiStart, and a date — return the schedule entry + template info
export function getScheduleEntry(mpasiStart, date, templates) {
  const info = getMPASIInfo(mpasiStart, date)
  if (!info?.hasStarted) return null
  const weekNum = Math.min(info.week, TOTAL_MPASI_WEEKS)
  const entry   = MPASI_SCHEDULE[weekNum - 1]
  if (!entry) return null
  const template   = templates.find(t => t.id === entry.templateId)
  const dow        = (date instanceof Date ? date : fromDateKey(date)).getDay()
  const validDays  = template?.days.filter(d => !d.note) || []
  const dayData    = validDays.find(d => d.dayOfWeek === dow)
                  ?? validDays[dow % validDays.length]
                  ?? null
  return { ...entry, template, dayData, mpasiWeekNum: weekNum, mpasiInfo: info }
}

export function findTemplateForDate(templates, date) {
  const key = toDateKey(date)
  const dated = templates.filter(t => t.startDate)
  for (const t of dated) {
    const start = fromDateKey(t.startDate)
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i)
      if (toDateKey(d) === key) return { template: t, dayIdx: i }
    }
  }
  return null
}
