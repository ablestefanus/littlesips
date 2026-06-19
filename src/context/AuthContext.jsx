import { createContext, useContext, useState, useEffect } from 'react'
import pb from '../lib/pb.js'

const AuthContext = createContext()

const ADMIN_USERNAMES = (import.meta.env.VITE_ADMIN_USERNAMES || 'stefanus').split(',')

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (pb.authStore.isValid) {
      setUser(toUser(pb.authStore.record))
    }
    setLoading(false)

    const unsub = pb.authStore.onChange((token, model) => {
      setUser(model ? toUser(model) : null)
    })
    return () => unsub()
  }, [])

  function avatarUrl(model) {
    if (!model?.avatar) return ''
    return pb.files.getURL(model, model.avatar)
  }

  function toUser(model) {
    const username = model.name || model.email?.split('@')[0] || ''
    return {
      id:        model.id,
      username,
      name:      username,
      babyName:  model.babyName || '',
      babyDob:   model.babyDob  || '',
      babyPhoto: avatarUrl(model),
      isAdmin:   ADMIN_USERNAMES.includes(username.toLowerCase()),
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
      if (msg?.email)    return { success: false, error: 'That username is already taken.' }
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
      const { avatarFile, ...fields } = updates

      const formData = new FormData()
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v ?? ''))
      if (avatarFile) formData.append('avatar', avatarFile)
      if (avatarFile === null) formData.append('avatar', '') // remove

      const record = await pb.collection('users').update(user.id, formData)
      pb.authStore.save(pb.authStore.token, record)
      setUser(toUser(record))
      return true
    } catch (e) {
      console.error('updateProfile error:', e)
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
