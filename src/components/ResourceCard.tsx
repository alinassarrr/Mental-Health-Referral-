import Link from 'next/link'
import type { Resource } from '@/lib/types'

const TYPE_COLORS: Record<string, string> = {
  NGO: 'bg-emerald-100 text-emerald-700',
  Helpline: 'bg-red-100 text-red-600',
  PHCC: 'bg-blue-100 text-blue-600',
  Clinic: 'bg-purple-100 text-purple-600',
  Hospital: 'bg-indigo-100 text-indigo-600',
}

export default function ResourceCard({ resource }: { resource: Resource }) {
  const services = resource.services
    ? resource.services.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div className="bg-white rounded-2xl border border-green-50 shadow-sm overflow-hidden hover:shadow-md transition-all">
      <Link href={`/resources/${resource.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 text-sm leading-snug">{resource.name}</h3>
        </div>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[resource.type] ?? 'bg-gray-100 text-gray-500'}`}>
            {resource.type}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{resource.country}</span>
        </div>
        {resource.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{resource.description}</p>
        )}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {services.slice(0, 3).map(s => (
              <span key={s} className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-lg">{s}</span>
            ))}
            {services.length > 3 && <span className="text-xs text-gray-400">+{services.length - 3}</span>}
          </div>
        )}
      </Link>
      {resource.phone && (
        <div className="px-4 pb-4">
          <a
            href={`tel:${resource.phone}`}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.8a16 16 0 006.29 6.29l1.32-1.32a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Call Now · {resource.phone}
          </a>
        </div>
      )}
    </div>
  )
}
