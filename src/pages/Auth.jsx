import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext.jsx'
import BabyMobile from '../components/BabyMobile.jsx'

export default function Auth() {
  const { login, register } = useAuth()
  const [tab, setTab]         = useState('login')
  const [username, setUsername] = useState('')
  const [pass, setPass]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const cardRef = useRef()
  const logoRef = useRef()
  const bgRef   = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([logoRef.current, cardRef.current], { opacity: 1 })
      const tl = gsap.timeline()
      tl.from(bgRef.current?.children || [], {
        scale: 0, opacity: 0, duration: 1.2, stagger: 0.18, ease: 'power3.out',
      }, 0)
      .from(logoRef.current, { y: -30, opacity: 0, duration: 0.6, ease: 'back.out(2)' }, 0.15)
      .from(cardRef.current, { y: 40, opacity: 0, duration: 0.6, ease: 'back.out(1.4)' }, 0.25)
    })
    return () => ctx.revert()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!username.trim()) { setError('Please enter a username.'); setLoading(false); return }

    const result = tab === 'login'
      ? login(username.trim(), pass)
      : register(username.trim(), pass)

    if (!result.success) {
      setError(result.error)
      gsap.to(cardRef.current, { x: [-8, 8, -6, 6, -3, 3, 0], duration: 0.4, ease: 'none' })
    }
    setLoading(false)
  }

  function switchTab(t) {
    setTab(t)
    setError('')
    gsap.from(cardRef.current?.querySelector('.auth-form'), {
      opacity: 0, y: 10, duration: 0.25, ease: 'power2.out',
    })
  }

  return (
    <div className="auth-page">
      {/* Background decorations */}
      <div ref={bgRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-15%', right: '-10%',
          width: '60vw', height: '60vw', maxWidth: 480, maxHeight: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(176,156,240,0.18) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-15%',
          width: '50vw', height: '50vw', maxWidth: 400, maxHeight: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,160,181,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '5%',
          width: '30vw', height: '30vw', maxWidth: 200, maxHeight: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(125,217,184,0.12) 0%, transparent 70%)',
        }} />
      </div>

      {/* Logo */}
      <div ref={logoRef} style={{ textAlign: 'center', marginBottom: 28, zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <BabyMobile size={96} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--text)' }}>
          Little<span style={{ color: 'var(--primary)' }}>Sips</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-mid)', marginTop: 4 }}>
          Every drop, every moment.
        </p>
      </div>

      {/* Auth card */}
      <div className="auth-card" ref={cardRef}>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
            Sign in
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">⚠️ {error}</div>}

          <div className="field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder={tab === 'register' ? 'Choose a password' : 'Your password'}
              value={pass}
              onChange={e => setPass(e.target.value)}
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={tab === 'register' ? 6 : undefined}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            style={{ marginTop: 8 }}
            disabled={loading}
          >
            {loading ? '…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {tab === 'register' && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-light)', marginTop: 16 }}>
            Your data is stored only on this device.
          </p>
        )}
      </div>
    </div>
  )
}
