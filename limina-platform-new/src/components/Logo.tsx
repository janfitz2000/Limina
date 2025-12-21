'use client'

import React, { useRef, useEffect } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
}

export function Logo({ size = 'md', animate = true }: LogoProps) {
  const logoRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 100,
  }

  const actualSize = sizeMap[size]

  useEffect(() => {
    if (animate && !hasAnimated.current && logoRef.current) {
      hasAnimated.current = true
      triggerAnimation()
    }
  }, [animate])

  const triggerAnimation = () => {
    if (!logoRef.current) return

    const checkmark = logoRef.current.querySelector('#checkmark') as SVGPathElement

    if (checkmark) {
      checkmark.style.animation = 'none'
      void (checkmark as unknown as HTMLElement).offsetWidth
      checkmark.style.animation = 'draw-checkmark 0.6s ease-out forwards'
    }
  }

  const handleLogoClick = () => {
    hasAnimated.current = false
    triggerAnimation()
  }

  return (
    <div
      ref={logoRef}
      className="limina-logo cursor-pointer select-none"
      onClick={handleLogoClick}
      style={{ width: actualSize, height: actualSize }}
    >
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#C9A227" />
            <stop offset="100%" stopColor="#B8960B" />
          </linearGradient>
          <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dark background with gold border */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="12"
          fill="#0C0A09"
          stroke="url(#goldGradient)"
          strokeWidth="2"
        />

        {/* Gold checkmark - clean and confident */}
        <path
          id="checkmark"
          d="M 28 52 L 44 68 L 72 32"
          stroke="url(#goldGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#goldGlow)"
        />
      </svg>

      <style jsx>{`
        .limina-logo {
          transition: transform 0.15s ease;
        }
        .limina-logo:hover {
          transform: scale(1.05);
        }
        .limina-logo:active {
          transform: scale(0.95);
        }

        #checkmark {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
        }

        @keyframes draw-checkmark {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  )
}

export function LogoStatic({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 100,
  }

  return (
    <div style={{ width: sizeMap[size], height: sizeMap[size] }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="goldGradientStatic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#C9A227" />
            <stop offset="100%" stopColor="#B8960B" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="92" height="92" rx="12" fill="#0C0A09" stroke="url(#goldGradientStatic)" strokeWidth="2" />
        <path d="M 28 52 L 44 68 L 72 32" stroke="url(#goldGradientStatic)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}
