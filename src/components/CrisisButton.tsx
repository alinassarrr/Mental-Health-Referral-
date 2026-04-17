'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function CrisisButton() {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="fixed bottom-20 right-4 md:bottom-8 md:right-6 z-50 flex items-center gap-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <div className={`transition-all duration-200 origin-right ${hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-white border border-red-100 rounded-2xl shadow-lg px-4 py-3 max-w-[220px] text-right">
          <p className="text-xs font-semibold text-gray-800 mb-0.5">In immediate danger?</p>
          <p className="text-[11px] text-gray-500 leading-snug">Call local emergency services. This directory is for informational purposes only.</p>
          <Link
            href="/hotlines"
            className="mt-2 inline-block text-[11px] font-bold text-red-600 hover:text-red-700 underline underline-offset-2"
          >
            View crisis hotlines →
          </Link>
        </div>
        {/* Arrow */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0"
             style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '7px solid #fff', filter: 'drop-shadow(1px 0 1px rgba(0,0,0,0.05))' }} />
      </div>

      {/* Button */}
      <Link href="/hotlines" aria-label="Crisis help - view hotlines">
        <span className="relative flex h-13 w-13">
          {/* Pulse ring */}
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-30" />
          {/* Core */}
          <span className="relative flex h-13 w-13 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                style={{ width: 52, height: 52 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} className="w-5 h-5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.8a16 16 0 006.29 6.29l1.32-1.32a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </span>
      </Link>
    </div>
  )
}
