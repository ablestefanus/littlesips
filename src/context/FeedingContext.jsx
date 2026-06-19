import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import { uid, toDateKey, SLOT_KEYS } from '../utils.js'

const FeedingContext = createContext()

export function FeedingProvider({ children }) {
  const { user } = useAuth()
  const [plans, setPlans]   = useState([])  // meal plans (what's PLANNED per date+slot)
  const [logs, setLogs]     = useState([])  // actual meal logs (what was eaten)
  const [foodTracker, setFoodTracker] = useState({})  // food introduction tracker
  const [foodCustom, setFoodCustom]   = useState({})  // per-month custom food additions/removals

  const planKey       = user ? `ls_plans_${user.id}`       : null
  const logKey        = user ? `ls_logs_${user.id}`        : null
  const foodKey       = user ? `ls_foodtracker_${user.id}` : null
  const foodCustomKey = user ? `ls_foodcustom_${user.id}`  : null

  useEffect(() => {
    if (!planKey) { setPlans([]); setLogs([]); setFoodTracker({}); setFoodCustom({}); return }
    try {
      setPlans(JSON.parse(localStorage.getItem(planKey) || '[]'))
      setLogs(JSON.parse(localStorage.getItem(logKey)  || '[]'))
      setFoodTracker(JSON.parse(localStorage.getItem(foodKey) || '{}'))
      setFoodCustom(JSON.parse(localStorage.getItem(foodCustomKey) || '{}'))
    } catch (_) { setPlans([]); setLogs([]); setFoodTracker({}); setFoodCustom({}) }
  }, [planKey, logKey, foodKey, foodCustomKey])

  const savePlans = useCallback((list) => {
    setPlans(list)
    if (planKey) localStorage.setItem(planKey, JSON.stringify(list))
  }, [planKey])

  const saveLogs = useCallback((list) => {
    setLogs(list)
    if (logKey) localStorage.setItem(logKey, JSON.stringify(list))
  }, [logKey])

  const saveFoodTracker = useCallback((map) => {
    setFoodTracker(map)
    if (foodKey) localStorage.setItem(foodKey, JSON.stringify(map))
  }, [foodKey])

  const saveFoodCustom = useCallback((map) => {
    setFoodCustom(map)
    if (foodCustomKey) localStorage.setItem(foodCustomKey, JSON.stringify(map))
  }, [foodCustomKey])

  // ── Plans ──────────────────────────────────────────────────
  function setPlanSlot(date, slot, foods) {
    const dateKey = toDateKey(date)
    const existing = plans.find(p => p.date === dateKey && p.slot === slot)
    if (existing) {
      savePlans(plans.map(p =>
        p.date === dateKey && p.slot === slot ? { ...p, foods } : p
      ))
    } else {
      savePlans([...plans, { id: uid(), userId: user.id, date: dateKey, slot, foods }])
    }
  }

  function getPlanSlot(date, slot) {
    const dateKey = toDateKey(date)
    return plans.find(p => p.date === dateKey && p.slot === slot)?.foods || []
  }

  function getPlansForDate(date) {
    const dateKey = toDateKey(date)
    const result = {}
    SLOT_KEYS.forEach(s => { result[s] = [] })
    plans.filter(p => p.date === dateKey).forEach(p => { result[p.slot] = p.foods })
    return result
  }

  function deletePlanSlot(date, slot) {
    const dateKey = toDateKey(date)
    savePlans(plans.filter(p => !(p.date === dateKey && p.slot === slot)))
  }

  // Import a single day from a template
  function importTemplateDay(date, templateDay) {
    importTemplateDays([{ date, dayData: templateDay }])
  }

  // Import multiple days in one save — avoids stale-closure overwrite bug
  function importTemplateDays(items) {
    const dateKeys = items.map(({ date }) => toDateKey(date))
    const filtered  = plans.filter(p => !dateKeys.includes(p.date))
    const newPlans  = []
    items.forEach(({ date, dayData }) => {
      const dateKey = toDateKey(date)
      SLOT_KEYS.forEach(slot => {
        const foods = dayData[slot] || []
        if (foods.length > 0) {
          newPlans.push({ id: uid(), userId: user.id, date: dateKey, slot, foods })
        }
      })
    })
    savePlans([...filtered, ...newPlans])
  }

  // ── Logs ───────────────────────────────────────────────────
  function logMeal({ date, slot, foodsEaten, plannedFoods, reaction, foodReactions, notes }) {
    const dateKey = toDateKey(date)
    const filtered = logs.filter(l => !(l.date === dateKey && l.slot === slot))
    const entry = {
      id: uid(),
      userId: user.id,
      date: dateKey,
      slot,
      foodsEaten: foodsEaten || [],
      plannedFoods: plannedFoods || [],
      reaction: reaction || null,
      foodReactions: foodReactions || {},
      notes: notes || '',
      loggedAt: new Date().toISOString(),
    }
    saveLogs([entry, ...filtered])
    return entry
  }

  function getLogSlot(date, slot) {
    const dateKey = toDateKey(date)
    return logs.find(l => l.date === dateKey && l.slot === slot) || null
  }

  function getLogsForDate(date) {
    const dateKey = toDateKey(date)
    return logs.filter(l => l.date === dateKey)
  }

  function deleteLog(id) {
    saveLogs(logs.filter(l => l.id !== id))
  }

  function getMealsDoneToday() {
    const today = toDateKey(new Date())
    return logs.filter(l => l.date === today && l.foodsEaten.length > 0)
  }

  // All unique foods ever eaten (for autocomplete)
  function getAllFoods() {
    const set = new Set()
    logs.forEach(l => l.foodsEaten.forEach(f => set.add(f)))
    plans.forEach(p => p.foods.forEach(f => set.add(f)))
    return [...set].sort()
  }

  // ── Food Tracker ───────────────────────────────────────────
  function getFoodEntry(food) {
    return foodTracker[food] ?? { tried: false, mpasiWeek: null, notes: '' }
  }

  function setFoodEntry(food, patch) {
    const updated = { ...foodTracker, [food]: { ...getFoodEntry(food), ...patch } }
    saveFoodTracker(updated)
  }

  function getAllFoodEntries() {
    return foodTracker
  }

  // ── Food Custom (add / remove per month+category) ──────────
  // Shape: { [month]: { [category]: { added: string[], hidden: string[] } } }
  function getFoodCustom(month, category) {
    return foodCustom[month]?.[category] ?? { added: [], hidden: [] }
  }

  function addCustomFood(month, category, food) {
    const mc = getFoodCustom(month, category)
    if (mc.added.includes(food)) return
    saveFoodCustom({
      ...foodCustom,
      [month]: { ...foodCustom[month], [category]: { ...mc, added: [...mc.added, food] } },
    })
  }

  function removeFood(month, category, food, isCustom) {
    const mc = getFoodCustom(month, category)
    const updated = isCustom
      ? { ...mc, added: mc.added.filter(f => f !== food) }
      : { ...mc, hidden: [...(mc.hidden || []), food] }
    saveFoodCustom({
      ...foodCustom,
      [month]: { ...foodCustom[month], [category]: updated },
    })
  }

  return (
    <FeedingContext.Provider value={{
      plans, logs,
      setPlanSlot, getPlanSlot, getPlansForDate, deletePlanSlot, importTemplateDay, importTemplateDays,
      logMeal, getLogSlot, getLogsForDate, deleteLog, getMealsDoneToday, getAllFoods,
      getFoodEntry, setFoodEntry, getAllFoodEntries,
      getFoodCustom, addCustomFood, removeFood,
    }}>
      {children}
    </FeedingContext.Provider>
  )
}

export const useFeeding = () => useContext(FeedingContext)
