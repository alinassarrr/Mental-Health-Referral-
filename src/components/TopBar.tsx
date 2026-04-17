'use client'
import Link from 'next/link'
import LanguageToggle from './LanguageToggle'

export default function TopBar() {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2">
        <span className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">MH</span>
        <span className="font-bold text-gray-900 text-sm">Mental Health MENA</span>
      </Link>
      <LanguageToggle />
    </header>
  )
}
