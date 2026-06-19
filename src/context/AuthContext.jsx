import { createContext, useContext, useState, useEffect } from 'react'
import { uid } from '../utils.js'

const AuthContext = createContext()

const ADMIN_USERNAMES = ['stefanus']

function isAdmin(username) {
  return ADMIN_USERNAMES.includes((username || '').toLowerCase())
}

function stripPassword({ password, ...safe }) {
  return { ...safe, isAdmin: isAdmin(safe.username) }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ls_currentUser')
      if (saved) {
        const parsed = JSON.parse(saved)
        setUser({ ...parsed, isAdmin: isAdmin(parsed.username) })
      }
    } catch (_) {}
    setLoading(false)
  }, [])

  function login(username, password) {
    try {
      const users = JSON.parse(localStorage.getItem('ls_users') || '[]')
      const found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password)
      if (!found) return { success: false, error: 'Wrong username or password.' }
      const safe = stripPassword(found)
      setUser(safe)
      localStorage.setItem('ls_currentUser', JSON.stringify(safe))
      return { success: true }
    } catch (_) {
      return { success: false, error: 'Something went wrong.' }
    }
  }

  function register(username, password) {
    try {
      const users = JSON.parse(localStorage.getItem('ls_users') || '[]')
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
        return { success: false, error: 'That username is already taken.' }
      const newUser = { id: uid(), username, name: username, password, createdAt: new Date().toISOString() }
      localStorage.setItem('ls_users', JSON.stringify([...users, newUser]))
      const safe = stripPassword(newUser)
      setUser(safe)
      localStorage.setItem('ls_currentUser', JSON.stringify(safe))
      return { success: true }
    } catch (_) {
      return { success: false, error: 'Something went wrong.' }
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('ls_currentUser')
  }

  function updateProfile(updates) {
    try {
      const users = JSON.parse(localStorage.getItem('ls_users') || '[]')
      const idx = users.findIndex(u => u.id === user.id)
      if (idx === -1) return false
      users[idx] = { ...users[idx], ...updates }
      localStorage.setItem('ls_users', JSON.stringify(users))
      const safe = stripPassword(users[idx])
      setUser(safe)
      localStorage.setItem('ls_currentUser', JSON.stringify(safe))
      return true
    } catch (_) {
      return false
    }
  }

  function getAllUsers() {
    if (!user?.isAdmin) return []
    try {
      return JSON.parse(localStorage.getItem('ls_users') || '[]').map(u => {
        const { password, ...safe } = u
        return { ...safe, isAdmin: isAdmin(safe.username) }
      })
    } catch (_) {
      return []
    }
  }

  function getAllLogs(userId) {
    if (!user?.isAdmin) return []
    try {
      return JSON.parse(localStorage.getItem(`ls_logs_${userId}`) || '[]')
    } catch (_) {
      return []
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, getAllUsers, getAllLogs }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
