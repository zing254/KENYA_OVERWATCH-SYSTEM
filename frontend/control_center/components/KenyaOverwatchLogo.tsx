'use client'

import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function KenyaOverwatchLogo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-sm' },
    md: { icon: 32, text: 'text-lg' },
    lg: { icon: 48, text: 'text-2xl' },
    xl: { icon: 64, text: 'text-3xl' },
  }
  
  const { icon, text } = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer circle - shield shape */}
        <circle cx="50" cy="50" r="48" fill="#14532D" stroke="#22C55E" strokeWidth="2"/>
        
        {/* Inner road/path */}
        <path
          d="M30 80 Q35 60 50 50 Q65 40 70 20"
          stroke="#FCD34D"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Road markings */}
        <path
          d="M42 65 L45 55 M52 45 L55 35"
          stroke="#FFFFFF"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Eye/surveillance symbol */}
        <ellipse cx="50" cy="42" rx="18" ry="12" stroke="#22C55E" strokeWidth="2" fill="none"/>
        <circle cx="50" cy="42" r="6" fill="#22C55E"/>
        <circle cx="50" cy="42" r="3" fill="#FFFFFF"/>
        
        {/* Shield outline accent */}
        <path
          d="M20 50 L20 35 Q20 15 50 10 Q80 15 80 35 L80 50"
          stroke="#BB0000"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Kenya flag colors accent */}
        <rect x="35" y="75" width="30" height="4" fill="#000000" rx="1"/>
        <rect x="35" y="80" width="30" height="4" fill="#BB0000" rx="1"/>
        <rect x="35" y="85" width="30" height="4" fill="#006600" rx="1"/>
        
        {/* Star accent */}
        <polygon
          points="50,25 52,30 58,30 53,34 55,40 50,36 45,40 47,34 42,30 48,30"
          fill="#FCD34D"
        />
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`${text} font-bold text-white leading-tight tracking-wide`}>
            KENYA OVERWATCH
          </span>
          <span className="text-xs text-green-400/70 font-medium tracking-widest">
            COMMAND CENTER
          </span>
        </div>
      )}
    </div>
  )
}
