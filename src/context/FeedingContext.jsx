import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import { toDateKey, SLOT_KEYS } from '../utils.js'
import pb from '../lib/pb.js'

const FeedingContext = createContext()

export function FeedingProvider({ children }) {
  const { user } = useAuth()
  const [plans,       setPlans]       = useState([])
  const [logs,        setLogs]        = useState([])
  const [foodTracker, setFoodTracker] = useState({})
  const [foodCustom,  setFoodCustom]  = useState({})

  // Load all data when user logs in
  useEffect(() => {
    if (!user) {
      setPlans([]); setLogs([]); setFoodTracker({}); setFoodCustom({})
      return
    }
    loadAll()
  }, [user?.id])

  async function loadAll() {
    try {
      const [plansRes, logsRes, ftRes, fcRes] = await Promise.all([
        pb.collection('plans').getFullList({ filter: `user="${user.id}"` }),
        pb.collection('logs').getFullList({ filter: `user="${user.id}"`, sort: '-loggedAt' }),
        pb.collection('foodtracker').getFullList({ filter: `user="${user.id}"` }),
        pb.collection('foodcustom').getFullList({ filter: `user="${user.id}"` }),
      ])
      setPlans(plansRes.map(normPlan))
      setLogs(logsRes.map(normLog))
      setFoodTracker(ftRes[0]?.data || {})
      setFoodCustom(fcRes[0]?.data || {})
    } catch (_) {}
  }

  // Normalize PocketBase records to the shape the rest of the app expects
  function normPlan(r) {
    return { id: r.id, userId: r.user, date: r.date, slot: r.slot, foods: r.foods || [] }
  }
  function normLog(r) {
    return {
      id: r.id, userId: r.user, date: r.date, slot: r.slot,
      foodsEaten: r.foodsEaten || [], plannedFoods: r.plannedFoods || [],
      reaction: r.reaction || null, foodReactions: r.foodReactions || {},
      notes: r.notes || '', loggedAt: r.loggedAt || '',
    }
  }

  // ── Plans ─────────────────────────────────────────────────────
  function getPlansForDate(date) {
    const dateKey = toDateKey(date)
    const result = {}
    SLOT_KEYS.forEach(s => { result[s] = [] })
    plans.filter(p => p.date === dateKey).forEach(p => { result[p.slot] = p.foods })
    return result
  }

  async function setPlanSlot(date, slot, foods) {
    const dateKey = toDateKey(date)
    const existing = plans.find(p => p.date === dateKey && p.slot === slot)
    if (existing) {
      const updated = await pb.collection('plans').update(existing.id, { foods })
      setPlans(prev => prev.map(p => p.id === existing.id ? normPlan(updated) : p))
    } else {
      const created = await pb.collection('plans').create({ user: user.id, date: dateKey, slot, foods })
      setPlans(prev => [...prev, normPlan(created)])
    }
  }

  async function deletePlanSlot(date, slot) {
    const dateKey = toDateKey(date)
    const existing = plans.find(p => p.date === dateKey && p.slot === slot)
    if (existing) {
      await pb.collection('plans').delete(existing.id)
      setPlans(prev => prev.filter(p => p.id !== existing.id))
    }
  }

  async function importTemplateDays(items) {
    const dateKeys = items.map(({ date }) => toDateKey(date))
    // Delete existing plans for these dates
    const toDelete = plans.filter(p => dateKeys.includes(p.date))
    await Promise.all(toDelete.map(p => pb.collection('plans').delete(p.id)))

    // Create new plans
    const created = []
    await Promise.all(items.map(async ({ date, dayData }) => {
      const dateKey = toDateKey(date)
      await Promise.all(SLOT_KEYS.map(async slot => {
        const foods = dayData[slot] || []
        if (foods.length > 0) {
          const r = await pb.collection('plans').create({ user: user.id, date: dateKey, slot, foods })
          created.push(normPlan(r))
        }
      }))
    }))
    setPlans(prev => [...prev.filter(p => !dateKeys.includes(p.date)), ...created])
  }

  async function importTemplateDay(date, templateDay) {
    await importTemplateDays([{ date, dayData: templateDay }])
  }

  // ── Logs ──────────────────────────────────────────────────────
  function getLogsForDate(date) {
    const dateKey = toDateKey(date)
    return logs.filter(l => l.date === dateKey)
  }

  function getLogSlot(date, slot) {
    const dateKey = toDateKey(date)
    return logs.find(l => l.date === dateKey && l.slot === slot) || null
  }

  async function logMeal({ date, slot, foodsEaten, plannedFoods, reaction, foodReactions, notes }) {
    const dateKey = toDateKey(date)
    const existing = logs.find(l => l.date === dateKey && l.slot === slot)
    const data = {
      user: user.id, date: dateKey, slot,
      foodsEaten: foodsEaten || [], plannedFoods: plannedFoods || [],
      reaction: reaction || null, foodReactions: foodReactions || {},
      notes: notes || '', loggedAt: new Date().toISOString(),
    }
    if (existing) {
      const updated = await pb.collection('logs').update(existing.id, data)
      setLogs(prev => prev.map(l => l.id === existing.id ? normLog(updated) : l))
      return normLog(updated)
    } else {
      const created = await pb.collection('logs').create(data)
      setLogs(prev => [normLog(created), ...prev])
      return normLog(created)
    }
  }

  async function deleteLog(id) {
    await pb.collection('logs').delete(id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  function getMealsDoneToday() {
    const today = toDateKey(new Date())
    return logs.filter(l => l.date === today && l.foodsEaten.length > 0)
  }

  function getAllFoods() {
    const set = new Set()
    logs.forEach(l => l.foodsEaten.forEach(f => set.add(f)))
    plans.forEach(p => p.foods.forEach(f => set.add(f)))
    return [...set].sort()
  }

  // ── Food Tracker ──────────────────────────────────────────────
  function getFoodEntry(food) {
    return foodTracker[food] ?? { tried: false, mpasiWeek: null, notes: '' }
  }

  async function setFoodEntry(food, patch) {
    const updated = { ...foodTracker, [food]: { ...getFoodEntry(food), ...patch } }
    await saveFoodTracker(updated)
  }

  async function saveFoodTracker(data) {
    setFoodTracker(data)
    try {
      const existing = await pb.collection('foodtracker').getFirstListItem(`user="${user.id}"`).catch(() => null)
      if (existing) {
        await pb.collection('foodtracker').update(existing.id, { data })
      } else {
        await pb.collection('foodtracker').create({ user: user.id, data })
      }
    } catch (_) {}
  }

  function getAllFoodEntries() { return foodTracker }

  // ── Food Custom ───────────────────────────────────────────────
  function getFoodCustom(month, category) {
    return foodCustom[month]?.[category] ?? { added: [], hidden: [] }
  }

  async function saveFoodCustom(data) {
    setFoodCustom(data)
    try {
      const existing = await pb.collection('foodcustom').getFirstListItem(`user="${user.id}"`).catch(() => null)
      if (existing) {
        await pb.collection('foodcustom').update(existing.id, { data })
      } else {
        await pb.collection('foodcustom').create({ user: user.id, data })
      }
    } catch (_) {}
  }

  async function addCustomFood(month, category, food) {
    const mc = getFoodCustom(month, category)
    if (mc.added.includes(food)) return
    await saveFoodCustom({
      ...foodCustom,
      [month]: { ...foodCustom[month], [category]: { ...mc, added: [...mc.added, food] } },
    })
  }

  async function removeFood(month, category, food, isCustom) {
    const mc = getFoodCustom(month, category)
    const updated = isCustom
      ? { ...mc, added: mc.added.filter(f => f !== food) }
      : { ...mc, hidden: [...(mc.hidden || []), food] }
    await saveFoodCustom({
      ...foodCustom,
      [month]: { ...foodCustom[month], [category]: updated },
    })
  }

  return (
    <FeedingContext.Provider value={{
      plans, logs,
      setPlanSlot, getPlansForDate, deletePlanSlot, importTemplateDay, importTemplateDays,
      logMeal, getLogSlot, getLogsForDate, deleteLog, getMealsDoneToday, getAllFoods,
      getFoodEntry, setFoodEntry, getAllFoodEntries,
      getFoodCustom, addCustomFood, removeFood,
    }}>
      {children}
    </FeedingContext.Provider>
  )
}

export const useFeeding = () => useContext(FeedingContext)
