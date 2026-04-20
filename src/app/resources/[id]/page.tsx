import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getResources, getResourceById } from '@/lib/sheets'
import MapEmbed from '@/components/MapEmbed'
import HoursDisplay from '@/components/HoursDisplay'

function parseHours(raw: string | undefined): string[] {
  if (!raw) return []

  // Proper JSON array of strings or {day, hours} objects
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.flatMap(item => {
        if (typeof item === 'string') return [item]
        if (item && typeof item === 'object' && 'day' in item && 'hours' in item)
          return [`${item.day}: ${item.hours}`]
        return []
      }).filter(Boolean)
    }
  } catch {}

  // Broken stringified objects: {day:Monday\nhours:8:30 AM to 4:30 PM}
  const objMatches = [...raw.matchAll(/\{day:([^\n,}]+)[\s\S]*?hours:([^}]+)\}/gi)]
  if (objMatches.length > 0)
    return objMatches.map(m => `${m[1].trim()}: ${m[2].trim()}`)

  // Plain comma-separated
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export const revalidate = 3600

export async function generateStaticParams() {
  const resources = await getResources()
  return resources.map((r) => ({ id: r.id }))
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const resource = await getResourceById(id)
  if (!resource) notFound()

  const services = resource.services
    ? resource.services.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const languages = resource.languages
    ? resource.languages.split(',').map((l) => l.trim()).filter(Boolean)
    : []

  const hours = parseHours(resource.hours)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/resources" className="text-teal-600 text-sm hover:underline mb-4 block">
        ← Back to Resources
      </Link>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{resource.name}</h1>
          <span className="shrink-0 text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">
            {resource.type}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{resource.country}</span>
          {resource.pricing && resource.pricing !== 'Unknown' && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{resource.pricing}</span>
          )}
          {resource.session_type && resource.session_type !== 'Unknown' && (
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{resource.session_type}</span>
          )}
          {resource.verified === 'TRUE' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Verified</span>
          )}
        </div>
        {resource.description && <p className="text-gray-600 mb-6">{resource.description}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {resource.phone && (
            <a href={`tel:${resource.phone}`} className="flex items-center gap-2 text-sm text-teal-600 hover:underline">
              📞 {resource.phone}
            </a>
          )}
          {resource.email && (
            <a href={`mailto:${resource.email}`} className="flex items-center gap-2 text-sm text-teal-600 hover:underline">
              ✉️ {resource.email}
            </a>
          )}
          {resource.website && (
            <a href={resource.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-teal-600 hover:underline">
              🌐 Website
            </a>
          )}
        </div>
        {resource.address && <div className="mb-4 text-sm text-gray-600">📍 {resource.address}</div>}
        <MapEmbed lat={resource.lat} lng={resource.lng} name={resource.name} />
        {hours.length > 0 && (
          <div className="mt-6">
            <HoursDisplay hours={hours} />
          </div>
        )}
        {services.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Services</h2>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <span key={s} className="text-xs bg-teal-50 text-teal-600 px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
        {languages.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Languages</h2>
            <div className="flex gap-2">
              {languages.map((l) => (
                <span key={l} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{l.toUpperCase()}</span>
              ))}
            </div>
          </div>
        )}
        {resource.stakeholders && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Affiliations</h2>
            <p className="text-sm text-gray-600">{resource.stakeholders}</p>
          </div>
        )}
      </div>
    </div>
  )
}
