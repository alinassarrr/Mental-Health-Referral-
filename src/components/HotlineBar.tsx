import type { Hotline } from '@/lib/types'

export default function HotlineBar({ hotlines }: { hotlines: Hotline[] }) {
  if (hotlines.length === 0) return null

  const items = hotlines.slice(0, 12)

  return (
    <div className="bg-red-600 text-white text-xs py-2 overflow-hidden flex items-center select-none">
      {/* Label */}
      <span className="shrink-0 font-bold px-3 z-10 bg-red-600 pr-4 border-r border-red-400">
        🆘 Crisis
      </span>

      {/* Scrolling track */}
      <div className="relative overflow-hidden flex-1 min-w-0">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-red-600 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-red-600 to-transparent z-10" />

        {/* Marquee — duplicated for seamless loop */}
        <div className="flex animate-marquee whitespace-nowrap">
          {[...items, ...items].map((h, i) => (
            <a
              key={i}
              href={`tel:${h.number}`}
              className="inline-flex items-center gap-2 mx-8 shrink-0 group"
            >
              <span className="text-white/90 font-medium text-[11px] uppercase tracking-wider">{h.country}</span>
              <span className="text-white font-extrabold text-sm tracking-wide group-hover:underline underline-offset-2">{h.number}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
