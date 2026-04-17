'use client'
import { useMemo } from 'react'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseDayEntry(entry: string): { day: string; dayIndex: number; time: string } | null {
  const match = entry.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)[:\s]+(.+)/i)
  if (!match) return null
  const dayIndex = DAY_NAMES.findIndex(d => d.toLowerCase() === match[1].toLowerCase())
  return { day: match[1], dayIndex, time: match[2].trim() }
}

export default function HoursDisplay({ hours }: { hours: string[] }) {
  const todayIndex = new Date().getDay()

  const schedule = useMemo(() => {
    const map = new Map<number, string>()
    hours.forEach(h => {
      const parsed = parseDayEntry(h)
      if (parsed) map.set(parsed.dayIndex, parsed.time)
    })
    return map
  }, [hours])

  // If we can't parse any day names, fall back to a simple list
  if (schedule.size === 0) {
    return (
      <div className="rounded-2xl bg-[#f9f7f4] border border-[#e8e3dc] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-3">Hours</p>
        <ul className="space-y-1.5">
          {hours.map((h, i) => (
            <li key={i} className="text-sm text-gray-700">{h}</li>
          ))}
        </ul>
      </div>
    )
  }

  const todayTime = schedule.get(todayIndex)
  const isOpenToday = !!todayTime && !todayTime.toLowerCase().includes('closed')

  return (
    <div className="rounded-2xl bg-[#f9f7f4] border border-[#e8e3dc] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">Hours</p>
        {todayTime ? (
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            isOpenToday ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOpenToday ? 'bg-green-500' : 'bg-gray-400'}`} />
            {isOpenToday ? 'Open today' : 'Closed today'}
          </span>
        ) : null}
      </div>

      {/* Day strip */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {DAY_SHORT.map((short, idx) => {
          const time = schedule.get(idx)
          const isToday = idx === todayIndex
          const isClosed = !time || time.toLowerCase().includes('closed')
          return (
            <div
              key={idx}
              className={`flex flex-col items-center rounded-xl py-2 px-1 transition-all ${
                isToday
                  ? 'bg-green-600 shadow-sm shadow-green-200'
                  : isClosed
                  ? 'bg-white/60 border border-[#e8e3dc]'
                  : 'bg-white border border-[#e8e3dc]'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                isToday ? 'text-green-100' : 'text-stone-400'
              }`}>
                {short}
              </span>
              <span className={`mt-1 w-1.5 h-1.5 rounded-full ${
                isToday ? 'bg-green-300' : isClosed ? 'bg-gray-200' : 'bg-green-400'
              }`} />
            </div>
          )
        })}
      </div>

      {/* Today's hours highlighted */}
      {todayTime && (
        <div className={`rounded-xl px-3 py-2.5 mb-2 ${
          isOpenToday ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'
        }`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-0.5">
            {DAY_NAMES[todayIndex]}
          </p>
          <p className={`text-sm font-semibold ${isOpenToday ? 'text-green-800' : 'text-gray-500'}`}>
            {todayTime}
          </p>
        </div>
      )}

      {/* Full week list */}
      <ul className="space-y-1">
        {DAY_NAMES.map((day, idx) => {
          const time = schedule.get(idx)
          if (!time) return null
          const isToday = idx === todayIndex
          const isClosed = time.toLowerCase().includes('closed')
          return (
            <li key={idx} className={`flex items-center justify-between text-xs py-1 border-b border-[#ede9e2] last:border-0 ${
              isToday ? 'font-semibold' : ''
            }`}>
              <span className={isToday ? 'text-green-700' : 'text-stone-500'}>{day}</span>
              <span className={isClosed ? 'text-gray-400' : isToday ? 'text-green-700' : 'text-gray-700'}>
                {time}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
