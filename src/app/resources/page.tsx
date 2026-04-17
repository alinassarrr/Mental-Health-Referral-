import { Suspense } from 'react'
import { getResources } from '@/lib/sheets'
import ResourceGrid from '@/components/ResourceGrid'

export const revalidate = 60

export default async function ResourcesPage() {
  const resources = await getResources()
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mental Health Resources</h1>
        <p className="text-gray-500 text-sm mt-1">
          {resources.length} resources across 17 MENA countries
        </p>
      </div>
      <div className="mt-6">
        <Suspense fallback={<div className="h-32 flex items-center justify-center text-gray-400 text-sm">Loading…</div>}>
          <ResourceGrid resources={resources} />
        </Suspense>
      </div>
    </div>
  )
}
