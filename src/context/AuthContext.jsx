import { createContext, useContext, useState, useEffect } from 'react'
import pb from '../lib/pb.js'

const AuthContext = createContext()

const ADMIN_USERNAMES = (import.meta.env.VITE_ADMIN_USERNAMES || 'stefanus').split(',')

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from PocketBase's built-in auth store
    if (pb.authStore.isValid) {
      const model = pb.authStore.record
      setUser(toUser(model))
    }
    setLoading(false)

    // Keep user state in sync if token expires
    const unsub = pb.authStore.onChange((token, model) => {
      setUser(model ? toUser(model) : null)
    })
    return () => unsub()
  }, [])

  function toUser(model) {
    const username = model.name || model.email?.split('@')[0] || ''
    return {
      id:       model.id,
      username,
      name:     username,
      babyName: model.babyName || '',
      babyDob:  model.babyDob  || '',
      babyPhoto: localStorage.getItem(`babyPhoto_${model.id}`) || '',
      isAdmin:  ADMIN_USERNAMES.includes(username.toLowerCase()),
    }
  }

  function toEmail(username) {
    return `${username.toLowerCase()}@littlesips.be`
  }

  async function login(username, password) {
    try {
      const auth = await pb.collection('users').authWithPassword(toEmail(username), password)
      setUser(toUser(auth.record))
      return { success: true }
    } catch (e) {
      return { success: false, error: 'Wrong username or password.' }
    }
  }

  async function register(username, password) {
    try {
      await pb.collection('users').create({
        email: toEmail(username),
        name: username,
        password,
        passwordConfirm: password,
      })
      return await login(username, password)
    } catch (e) {
      console.error('Register error:', e, e?.response)
      const msg = e?.response?.data
      if (msg?.email) return { success: false, error: 'That username is already taken.' }
      if (msg?.password) return { success: false, error: 'Password must be at least 8 characters.' }
      return { success: false, error: e?.message || 'Something went wrong.' }
    }
  }

  function logout() {
    pb.authStore.clear()
    setUser(null)
  }

  async function updateProfile(updates) {
    try {
      const { babyPhoto, ...pbUpdates } = updates
      if (babyPhoto !== undefined) {
        if (babyPhoto) localStorage.setItem(`babyPhoto_${user.id}`, babyPhoto)
        else localStorage.removeItem(`babyPhoto_${user.id}`)
      }
      const record = await pb.collection('users').update(user.id, pbUpdates)
      await pb.collection('users').authRefresh()
      setUser({ ...toUser(record), babyPhoto: babyPhoto ?? user.babyPhoto ?? '' })
      return true
    } catch (_) {
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
