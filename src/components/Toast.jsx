import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Toast({ message, show }) {
  const ref = useRef()

  useEffect(() => {
    if (show) {
      gsap.timeline()
        .to(ref.current, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' })
        .to(ref.current, { opacity: 0, y: 8, duration: 0.3, delay: 2.2 })
    }
  }, [show, message])

  return (
    <div className="toast" ref={ref}>
      {message}
    </div>
  )
}
