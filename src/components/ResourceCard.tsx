import Link from 'next/link'
import type { Resource } from '@/lib/types'

const PRICING_COLORS: Record<string, string> = {
  Free: 'bg-emerald-100 text-emerald-700',
  Sliding: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-gray-100 text-gray-600',
  Unknown: 'bg-gray-100 text-gray-400',
}

const TYPE_COLORS: Record<string, string> = {
  NGO: 'bg-teal-100 text-teal-700',
  Helpline: 'bg-red-100 text-red-700',
  PHCC: 'bg-blue-100 text-blue-700',
  Clinic: 'bg-purple-100 text-purple-700',
  Hospital: 'bg-indigo-100 text-indigo-700',
}

export default function ResourceCard({ resource }: { resource: Resource }) {
  const services = resource.services
    ? resource.services.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <Link
      href={`/resources/${resource.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
      aria-label={resource.name}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-base leading-snug">{resource.name}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${PRICING_COLORS[resource.pricing] ?? PRICING_COLORS.Unknown}`}>
          {resource.pricing || 'Unknown'}
        </span>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[resource.type] ?? 'bg-gray-100 text-gray-500'}`}>
          {resource.type}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{resource.country}</span>
      </div>
      {resource.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{resource.description}</p>
      )}
      {services.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {services.slice(0, 4).map((s) => (
            <span key={s} className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded">{s}</span>
          ))}
          {services.length > 4 && <span className="text-xs text-gray-400">+{services.length - 4}</span>}
        </div>
      )}
    </Link>
  )
}
