'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/resources', label: 'Resources' },
  { href: '/countries', label: 'Countries' },
  { href: '/hotlines', label: 'Hotlines' },
]

export default function TopBar() {
  const pathname = usePathname()
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-2">
        <span className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">MH</span>
        <span className="font-bold text-gray-900 text-sm">Mental Health MENA</span>
      </Link>
      <nav className="hidden md:flex items-center gap-1">
        {NAV.map(({ href, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'text-green-700 bg-green-50'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
