import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function BabyMobile({ size = 80 }) {
  const armRef = useRef()
  const m1Ref = useRef()
  const m2Ref = useRef()
  const m3Ref = useRef()
  const sceneRef = useRef()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(sceneRef.current, { transformPerspective: 400 })

      gsap.to(armRef.current, {
        rotateY: 360,
        duration: 18,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 0%',
      })

      const hangItems = [m1Ref.current, m2Ref.current, m3Ref.current]
      hangItems.forEach((el, i) => {
        gsap.to(el, {
          rotateZ: 6,
          duration: 2.2 + i * 0.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.3,
        })
        gsap.to(el, {
          y: -4,
          duration: 1.8 + i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.5,
        })
      })
    }, sceneRef)
    return () => ctx.revert()
  }, [])

  const s = size
  const armW = s
  const armH = s * 0.08
  const stringH = s * 0.3
  const itemSize = s * 0.22

  const positions = [0.15, 0.5, 0.85]
  const items = ['🌙', '⭐', '☁️']

  return (
    <div ref={sceneRef} style={{ width: s, height: s * 0.7, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      {/* Vertical hanger */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 3,
        height: s * 0.18,
        background: 'linear-gradient(to bottom, var(--primary-light), var(--primary))',
        borderRadius: 99,
      }} />

      {/* Horizontal arm */}
      <div ref={armRef} style={{
        position: 'absolute',
        top: s * 0.16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: armW,
        height: armH,
        background: 'linear-gradient(90deg, var(--primary-light), var(--primary), var(--primary-light))',
        borderRadius: 99,
        transformStyle: 'preserve-3d',
      }}>
        {/* Hanging items */}
        {positions.map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${pos * 100}%`,
            top: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* String */}
            <div style={{
              width: 1.5,
              height: stringH,
              background: 'var(--primary-light)',
              opacity: 0.6,
            }} />
            {/* Charm */}
            <div ref={i === 0 ? m1Ref : i === 1 ? m2Ref : m3Ref} style={{
              width: itemSize,
              height: itemSize,
              borderRadius: '50%',
              background: ['var(--pink-light)', 'var(--peach-light)', 'var(--sky-light)'][i],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: itemSize * 0.6,
              boxShadow: '0 2px 8px rgba(139,111,232,0.15)',
              transformOrigin: '50% -100%',
            }}>
              {items[i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
