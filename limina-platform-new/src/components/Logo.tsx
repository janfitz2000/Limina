import React from 'react'

export function Logo() {
  return (
    <div className="limina-logo cursor-pointer" id="nav-logo">
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