'use client'
import { useEffect, useState, useRef } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

interface AnimatedStatProps {
  value: string  // e.g. "5h", "118Md€", "3"
  label: string
}

export default function AnimatedStat({ value, label }: AnimatedStatProps) {
  const { ref, isVisible } = useScrollAnimation(0.3)
  const [displayed, setDisplayed] = useState('0')

  useEffect(() => {
    if (!isVisible) return

    // Extract numeric part and suffix
    const match = value.match(/^(\d+)(.*)$/)
    if (!match) { setDisplayed(value); return }

    const target = parseInt(match[1])
    const suffix = match[2]
    const duration = 1200
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * target)
      setDisplayed(current + suffix)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isVisible, value])

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <span style={{
        display: 'block',
        fontFamily: 'var(--font-syne)',
        fontSize: '36px',
        fontWeight: '700',
        color: 'white',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease'
      }}>
        {displayed}
      </span>
      <span style={{
        display: 'block',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginTop: '6px',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s ease 0.2s'
      }}>
        {label}
      </span>
    </div>
  )
}