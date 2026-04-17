'use client'
import { useState, useRef, useEffect } from 'react'
import { MENA_COUNTRIES } from '@/lib/countries'

export interface Filters { country: string; type: string }

const TYPES = ['NGO', 'Helpline', 'PHCC', 'Clinic', 'Hospital']

const FLAGS: Record<string, string> = {
  Algeria: '🇩🇿', Egypt: '🇪🇬', Iran: '🇮🇷', Iraq: '🇮🇶',
  Palestine: '🇵🇸', Jordan: '🇯🇴', Kuwait: '🇰🇼', Lebanon: '🇱🇧',
  Libya: '🇱🇾', Morocco: '🇲🇦', Oman: '🇴🇲', Qatar: '🇶🇦',
  'Saudi Arabia': '🇸🇦', Syria: '🇸🇾', Tunisia: '🇹🇳', UAE: '🇦🇪', Yemen: '🇾🇪',
}

const TYPE_ICONS: Record<string, string> = {
  NGO: '🤝', Helpline: '📞', PHCC: '🏥', Clinic: '🩺', Hospital: '🏨',
}

export default function FilterPanel({ filters, onChange }: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = MENA_COUNTRIES.filter(c =>
    c.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setQuery('')
  }, [open])

  const pick = (c: string) => {
    onChange({ ...filters, country: c === filters.country ? '' : c })
    setOpen(false)
  }

  return (
    <div className="rounded-2xl bg-[#f9f7f4] border border-[#e8e3dc] p-4 flex flex-col gap-4">

      {/* Country selector */}
      <div className="relative" ref={ref}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-2">Country</p>
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-2.5 w-full sm:w-64 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
            open
              ? 'border-green-400 bg-white shadow-sm ring-2 ring-green-100'
              : 'border-[#ddd8d0] bg-white hover:border-green-300'
          }`}
        >
          <span className="text-lg leading-none">
            {filters.country ? FLAGS[filters.country] : '🌍'}
          </span>
          <span className={filters.country ? 'text-gray-800' : 'text-gray-400'}>
            {filters.country || 'All countries'}
          </span>
          {filters.country && (
            <button
              onClick={e => { e.stopPropagation(); onChange({ ...filters, country: '' }) }}
              className="ml-auto text-gray-300 hover:text-gray-600 transition-colors"
              aria-label="Clear country"
            >
              ✕
            </button>
          )}
          {!filters.country && (
            <svg className={`ml-auto w-4 h-4 text-gray-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1.5 z-50 w-full sm:w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-2.5 border-b border-gray-50">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search country…"
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500">✕</button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto max-h-52 py-1">
              {matches.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">No results</p>
              ) : (
                matches.map(c => (
                  <button
                    key={c}
                    onClick={() => pick(c)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      filters.country === c
                        ? 'bg-green-50 text-green-800 font-semibold'
                        : 'text-gray-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-base">{FLAGS[c]}</span>
                    <span>{c}</span>
                    {filters.country === c && (
                      <span className="ml-auto text-green-500 text-xs">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Type pills */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-2">Type</p>
        <div className="flex flex-wrap gap-2">
          {['All', ...TYPES].map(tp => {
            const active = tp === 'All' ? !filters.type : filters.type === tp
            return (
              <button
                key={tp}
                onClick={() => onChange({ ...filters, type: tp === 'All' ? '' : tp })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 ${
                  active
                    ? 'bg-green-600 text-white shadow-sm shadow-green-200'
                    : 'bg-white border border-[#ddd8d0] text-gray-600 hover:border-green-300 hover:text-green-700'
                }`}
              >
                {tp !== 'All' && <span className="text-sm leading-none">{TYPE_ICONS[tp]}</span>}
                {tp}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
