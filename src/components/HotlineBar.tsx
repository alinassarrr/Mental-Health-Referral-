import type { Hotline } from '@/lib/types'

export default function HotlineBar({ hotlines }: { hotlines: Hotline[] }) {
  if (hotlines.length === 0) return null
  return (
    <div className="bg-red-600 text-white text-xs py-2 px-4 flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">
      <span className="font-bold shrink-0">🆘 Crisis:</span>
      {hotlines.slice(0, 8).map(h => (
        <a key={`${h.country}-${h.number}`} href={`tel:${h.number}`} className="hover:underline shrink-0">
          {h.country}: <strong>{h.number}</strong>
        </a>
      ))}
    </div>
  )
}
