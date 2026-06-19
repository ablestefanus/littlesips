import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext.jsx'
import { useFeeding } from '../context/FeedingContext.jsx'
import { babyAgeLabel, calcMPASIStart, getMPASIInfo, TOTAL_MPASI_WEEKS } from '../utils.js'

const TOTAL_WEEKS = TOTAL_MPASI_WEEKS

export default function Profile() {
  const { user, logout, updateProfile } = useAuth()
  const { logs }                        = useFeeding()
  const [name, setName]         = useState(user?.name || '')
  const [babyName, setBabyName] = useState(user?.babyName || '')
  const [babyDob, setBabyDob]   = useState(user?.babyDob || '')
  const [babyPhoto, setBabyPhoto] = useState(user?.babyPhoto || '')
  const [saved, setSaved]       = useState(false)
  const [photoHover, setPhotoHover] = useState(false)
  const photoInputRef = useRef()
  const pageRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = Array.from(pageRef.current?.children || [])
      gsap.set(els, { opacity: 1, y: 0 })
      gsap.fromTo(els, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' })
    })
    return () => ctx.revert()
  }, [])

  function handleSave() {
    updateProfile({ name, babyName, babyDob, babyPhoto })
    setSaved(true)
    const btn = pageRef.current?.querySelector('.save-profile-btn')
    if (btn) gsap.timeline().to(btn, { scale: 0.96, duration: 0.1 }).to(btn, { scale: 1, duration: 0.2, ease: 'back.out(3)' })
    setTimeout(() => setSaved(false), 2000)
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target.result
      setBabyPhoto(dataUrl)
      // Save immediately so sidebar + header update right away
      updateProfile({ name, babyName, babyDob, babyPhoto: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setBabyPhoto('')
    updateProfile({ name, babyName, babyDob, babyPhoto: '' })
  }

  const initials   = (name || user?.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const ageLabel   = babyDob ? babyAgeLabel(babyDob) : null
  const mpasiStart = babyDob ? calcMPASIStart(babyDob, 6) : null
  const mpasiInfo  = mpasiStart ? getMPASIInfo(mpasiStart) : null
  const uniqueDays = new Set(logs.map(l => l.date)).size

  return (
    <div ref={pageRef}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 20, color: 'var(--text)' }}>Baby's Profile</h2>

      {/* Avatar + stats */}
      <div className="card card-padded" style={{ marginBottom: 16, textAlign: 'center' }}>

        {/* Photo upload area */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
          <div
            onClick={() => photoInputRef.current?.click()}
            onMouseEnter={() => setPhotoHover(true)}
            onMouseLeave={() => setPhotoHover(false)}
            style={{
              width: 96, height: 96, borderRadius: '50%', cursor: 'pointer', position: 'relative', overflow: 'hidden',
              boxShadow: photoHover ? 'var(--shadow-primary)' : 'var(--shadow)',
              transition: 'box-shadow 0.2s',
            }}
          >
            {babyPhoto ? (
              <img src={babyPhoto} alt="Baby" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 900, color: 'white',
              }}>{initials}</div>
            )}
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              opacity: photoHover ? 1 : 0, transition: 'opacity 0.18s',
              color: 'white', gap: 2,
            }}>
              <span style={{ fontSize: 20 }}>📷</span>
              <span style={{ fontSize: 10, fontWeight: 800 }}>{babyPhoto ? 'Change' : 'Add photo'}</span>
            </div>
          </div>

          {/* Remove badge */}
          {babyPhoto && (
            <button
              onClick={removePhoto}
              title="Remove photo"
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 22, height: 22, borderRadius: '50%',
                background: '#F5A0B5', border: '2px solid white',
                color: 'white', fontSize: 11, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', lineHeight: 1,
              }}
            >×</button>
          )}
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text)' }}>{user?.name}</div>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 2 }}>{user?.email}</div>
        {ageLabel && (
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
            {babyName || 'Baby'} · {ageLabel}
          </div>
        )}
        {mpasiInfo?.hasStarted && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
            padding: '5px 14px', borderRadius: 99,
            background: 'linear-gradient(90deg, #7DD9B8, #A3CCFF)',
            fontSize: 13, fontWeight: 800, color: '#1A3A30',
          }}>
            🌱 MPASI Month {mpasiInfo.month} · Week {Math.min(mpasiInfo.week, TOTAL_WEEKS)}
          </div>
        )}
        {mpasiInfo && !mpasiInfo.hasStarted && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
            padding: '5px 14px', borderRadius: 99,
            background: '#FFF4E0', fontSize: 13, fontWeight: 700, color: '#7A4500',
          }}>
            ⏳ MPASI starts in {mpasiInfo.daysUntilStart} days
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--primary)' }}>{logs.length}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Meals logged</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: '#7DD9B8' }}>{uniqueDays}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Days tracked</div>
          </div>
          {mpasiInfo?.hasStarted && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: '#F5A0B5' }}>
                {Math.min(mpasiInfo.week, TOTAL_WEEKS)}
                <span style={{ fontSize: 13, color: 'var(--text-light)', fontFamily: 'var(--font-body)' }}>/{TOTAL_WEEKS}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>MPASI weeks</div>
            </div>
          )}
        </div>
      </div>

      {/* Edit profile */}
      <div className="card card-padded" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, color: 'var(--text)' }}>Baby Details</div>
        <div className="field">
          <label>Your name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Baby's name <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-light)' }}>(optional)</span></label>
          <input type="text" placeholder="e.g. Lily, Baby J, …" value={babyName} onChange={e => setBabyName(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Baby's date of birth</label>
          <input type="date" value={babyDob} onChange={e => setBabyDob(e.target.value)} />
          {babyDob && (
            <div style={{
              marginTop: 10, padding: '10px 14px',
              background: mpasiInfo?.hasStarted ? 'rgba(125,217,184,0.12)' : '#FFF4E0',
              border: `1px solid ${mpasiInfo?.hasStarted ? 'rgba(125,217,184,0.4)' : '#FFD4A3'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 800, color: 'var(--text)' }}>🌱 Complementary feeding (MPASI)</span>
              <br />
              Start date: <strong>{mpasiStart}</strong> · 6 months after birth
              <br />
              {mpasiInfo?.hasStarted
                ? <span style={{ color: '#2A7A50', fontWeight: 700 }}>Currently Month {mpasiInfo.month}, Week {Math.min(mpasiInfo.week, TOTAL_WEEKS)} of {TOTAL_WEEKS}</span>
                : mpasiInfo
                ? <span style={{ color: '#7A4500', fontWeight: 700 }}>Starts in {mpasiInfo.daysUntilStart} day{mpasiInfo.daysUntilStart !== 1 ? 's' : ''}</span>
                : null}
            </div>
          )}
        </div>
        <button className="btn btn-primary save-profile-btn w-full" onClick={handleSave} style={{ marginTop: 16 }}>
          {saved ? '✓ Saved!' : 'Save changes'}
        </button>
      </div>

      {/* MPASI month progress */}
      {mpasiInfo?.hasStarted && (
        <div className="card card-padded" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: 'var(--text)' }}>
            Complementary Feeding Progress
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-mid)', fontWeight: 600 }}>
              Week {Math.min(mpasiInfo.week, TOTAL_WEEKS)} of {TOTAL_WEEKS}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Month {mpasiInfo.month}</span>
          </div>
          <div style={{ height: 10, background: 'var(--bg-alt)', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{
              height: '100%',
              width: `${Math.min((mpasiInfo.week / TOTAL_WEEKS) * 100, 100)}%`,
              background: 'linear-gradient(90deg, #7DD9B8, var(--primary))',
              borderRadius: 99,
            }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {Array.from({ length: Math.ceil(TOTAL_WEEKS / 4) }, (_, i) => {
              const m = i + 1
              const isCurrent = m === mpasiInfo.month
              const isPast    = m < mpasiInfo.month
              return (
                <div key={i} style={{
                  padding: '7px 4px', borderRadius: 10, textAlign: 'center',
                  background: isCurrent ? 'rgba(139,111,232,0.1)' : isPast ? 'var(--bg-alt)' : 'var(--bg)',
                  border: `1.5px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: isCurrent ? 'var(--primary)' : isPast ? 'var(--text-mid)' : 'var(--text-light)' }}>
                    {isPast ? '✓ ' : isCurrent ? '▶ ' : ''}Month {m}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 1 }}>
                    Wk {(m-1)*4+1}–{Math.min(m*4, TOTAL_WEEKS)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* About */}
      <div className="card card-padded" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, color: 'var(--text)' }}>About LittleSips</div>
        <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>
          Your data is stored privately on this device. Nothing is sent to any server. 🔒
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>Version 2.0.0</div>
      </div>

      <button className="btn btn-danger w-full" onClick={logout} style={{ marginTop: 8 }}>Sign out</button>
    </div>
  )
}
