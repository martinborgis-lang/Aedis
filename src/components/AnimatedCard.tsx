'use client'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  delay?: number  // stagger delay in ms
  style?: React.CSSProperties
  scale?: boolean // Enable scale animation for role cards
}

export default function AnimatedCard({ children, delay = 0, style, scale = false }: Props) {
  const { ref, isVisible } = useScrollAnimation(0.1)

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: scale
          ? (isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(30px)')
          : (isVisible ? 'translateY(0)' : 'translateY(40px)'),
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        ...style
      }}
    >
      {children}
    </div>
  )
}