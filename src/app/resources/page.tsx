import { getResources } from '@/lib/sheets'
import ResourceGrid from '@/components/ResourceGrid'
import CrisisDisclaimer from '@/components/CrisisDisclaimer'
import Footer from '@/components/Footer'

export const revalidate = 3600

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
      <CrisisDisclaimer />
      <div className="mt-6">
        <ResourceGrid resources={resources} />
      </div>
      <Footer />
    </div>
  )
}
