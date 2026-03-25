'use client'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { ReactNode } from 'react'

export default function AnimatedTitle({ children }: { children: ReactNode }) {
  const { ref, isVisible } = useScrollAnimation(0.2)
  return (
    <div ref={ref} style={{
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
      transition: 'opacity 0.8s ease, transform 0.8s ease'
    }}>
      {children}
    </div>
  )
}