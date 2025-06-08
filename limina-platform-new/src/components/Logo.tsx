'use client'

import React, { useRef } from 'react'

export function Logo() {
  const logoRef = useRef<HTMLDivElement>(null)

  const handleLogoClick = () => {
    if (!logoRef.current) return
    
    const check = logoRef.current.querySelector('#header-check') as SVGPathElement
    const coin = logoRef.current.querySelector('#header-coin') as SVGCircleElement
    
    if (check && coin) {
      // Reset animations
      check.style.animation = 'none'
      coin.style.animation = 'none'
      
      // Trigger reflow
      void (check as unknown as HTMLElement).offsetWidth
      void (coin as unknown as HTMLElement).offsetWidth
      
      // Restart animations
      check.style.animation = 'draw-check 0.8s ease-out forwards'
      coin.style.animation = 'coin-emerge-spin 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s forwards'
    }
  }

  return (
    <div 
      ref={logoRef}
      className="limina-logo cursor-pointer" 
      id="nav-logo"
      onClick={handleLogoClick}
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="25" fill="#10344C"/>
        <path
          id="header-check"
          d="M15 55 L40 80 L85 22"
          stroke="#FFFFFF"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle
          id="header-coin"
          cx="39"
          cy="50"
          r="9"
          fill="#FACC15"
          stroke="#F59E0B"
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}
