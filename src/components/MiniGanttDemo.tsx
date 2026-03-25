'use client'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useEffect, useState } from 'react'

const TASKS = [
  { name: 'Démolition',      lot: '01', start: 0,  duration: 2,  status: 'done',       color: '#FF7A3D' },
  { name: 'Gros œuvre',      lot: '02', start: 2,  duration: 5,  status: 'done',       color: '#FF7A3D' },
  { name: 'Étanchéité',      lot: '03', start: 6,  duration: 2,  status: 'done',       color: '#FF7A3D' },
  { name: 'Menuiseries',     lot: '04', start: 7,  duration: 3,  status: 'in_progress', color: '#4488ff' },
  { name: 'Cloisons',        lot: '05', start: 8,  duration: 3,  status: 'in_progress', color: '#4488ff' },
  { name: 'Électricité',     lot: '06', start: 9,  duration: 4,  status: 'pending',    color: '#334466' },
  { name: 'Plomberie',       lot: '07', start: 9,  duration: 3,  status: 'pending',    color: '#334466' },
  { name: 'Revêtements',     lot: '08', start: 12, duration: 3,  status: 'pending',    color: '#334466' },
  { name: 'Peintures',       lot: '09', start: 14, duration: 2,  status: 'pending',    color: '#334466' },
  { name: 'Livraison',       lot: '10', start: 16, duration: 1,  status: 'pending',    color: '#FF7A3D' },
]

const TOTAL_WEEKS = 18
const TODAY_WEEK = 10

export default function MiniGanttDemo() {
  const { ref, isVisible } = useScrollAnimation(0.2)
  const [animProgress, setAnimProgress] = useState(0)

  useEffect(() => {
    if (!isVisible) return
    let start: number
    const duration = 1800
    function tick(ts: number) {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setAnimProgress(p)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isVisible])

  // Week labels
  const weeks = Array.from({ length: TOTAL_WEEKS }, (_, i) => `S${i + 1}`)

  return (
    <div
      ref={ref}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div>
          <p style={{
            fontSize: '13px',
            fontWeight: '500',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-syne)',
            margin: 0
          }}>
            Rénovation Cassis
          </p>
          <p style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
            margin: '2px 0 0'
          }}>
            10 lots · 18 semaines · 1.3M€
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '12px',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#FF7A3D', display: 'inline-block' }} />
            Terminé
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#4488ff', display: 'inline-block' }} />
            En cours
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#334466', display: 'inline-block' }} />
            À venir
          </span>
        </div>
      </div>

      {/* Week headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '90px 1fr',
        gap: '0',
        marginBottom: '4px'
      }}>
        <div />
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${TOTAL_WEEKS}, 1fr)`
        }}>
          {weeks.map((w, i) => (
            <div key={i} style={{
              fontSize: '9px',
              color: i === TODAY_WEEK - 1
                ? 'rgba(255,122,61,0.8)'
                : 'rgba(255,255,255,0.2)',
              textAlign: 'center',
              fontWeight: i === TODAY_WEEK - 1 ? '600' : '400'
            }}>
              {i % 2 === 0 ? w : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Today line + Task rows */}
      <div style={{ position: 'relative' }}>
        {/* Today vertical line */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `calc(90px + ${((TODAY_WEEK - 0.5) / TOTAL_WEEKS) * 100}%)`,
          width: '1px',
          background: 'rgba(255,122,61,0.4)',
          zIndex: 2
        }}>
          <div style={{
            position: 'absolute',
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            color: 'rgba(255,122,61,0.8)',
            whiteSpace: 'nowrap',
            fontWeight: '500'
          }}>
            Aujourd'hui
          </div>
        </div>

        {/* Task rows */}
        {TASKS.map((task, i) => {
          const delay = i * 0.08
          const taskProgress = Math.max(0, Math.min(1, (animProgress - delay) / 0.5))
          const barWidth = taskProgress * (task.duration / TOTAL_WEEKS) * 100

          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr',
                marginBottom: '5px',
                opacity: animProgress > delay ? 1 : 0,
                transition: 'opacity 0.3s ease'
              }}
            >
              {/* Task name */}
              <div style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.55)',
                display: 'flex',
                alignItems: 'center',
                paddingRight: '8px',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}>
                <span style={{
                  fontSize: '9px',
                  color: 'rgba(255,122,61,0.5)',
                  marginRight: '4px',
                  fontFamily: 'var(--font-syne)'
                }}>
                  {task.lot}
                </span>
                {task.name}
              </div>

              {/* Bar track */}
              <div style={{
                position: 'relative',
                height: '22px',
                display: 'grid',
                gridTemplateColumns: `repeat(${TOTAL_WEEKS}, 1fr)`,
                gap: '1px',
                alignItems: 'center'
              }}>
                {/* Background grid cells */}
                {Array.from({ length: TOTAL_WEEKS }).map((_, wi) => (
                  <div key={wi} style={{
                    height: '100%',
                    background: wi % 2 === 0
                      ? 'rgba(255,255,255,0.015)'
                      : 'transparent',
                    borderRadius: '2px'
                  }} />
                ))}

                {/* Animated bar */}
                <div style={{
                  position: 'absolute',
                  left: `${(task.start / TOTAL_WEEKS) * 100}%`,
                  width: `${barWidth}%`,
                  height: '14px',
                  background: task.status === 'done'
                    ? `linear-gradient(90deg, ${task.color}, rgba(255,122,61,0.7))`
                    : task.status === 'in_progress'
                    ? `linear-gradient(90deg, ${task.color}, rgba(68,136,255,0.5))`
                    : 'rgba(51,68,102,0.6)',
                  borderRadius: '3px',
                  transition: 'width 0.05s ease',
                  boxShadow: task.status === 'done'
                    ? '0 0 8px rgba(255,122,61,0.3)'
                    : task.status === 'in_progress'
                    ? '0 0 8px rgba(68,136,255,0.3)'
                    : 'none'
                }}>
                  {/* Progress fill for in_progress */}
                  {task.status === 'in_progress' && taskProgress > 0.8 && (
                    <div style={{
                      position: 'absolute',
                      right: '3px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.8)',
                      boxShadow: '0 0 4px rgba(255,255,255,0.5)'
                    }} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
          <span style={{ color: '#FF7A3D', fontWeight: '600' }}>3</span> lots terminés
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
          <span style={{ color: '#4488ff', fontWeight: '600' }}>2</span> en cours
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>5</span> à venir
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
          Avancement <span style={{ color: '#FF7A3D', fontWeight: '600' }}>55%</span>
        </div>
      </div>
    </div>
  )
}