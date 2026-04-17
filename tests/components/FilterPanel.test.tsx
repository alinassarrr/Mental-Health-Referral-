import { render, screen, fireEvent } from '@testing-library/react'
import ResourceGrid from '@/components/ResourceGrid'
import type { Resource } from '@/lib/types'

jest.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en' }),
}))

const makeResource = (overrides: Partial<Resource>): Resource => ({
  id: 'r1', name: 'Test', country: 'Egypt', type: 'Clinic',
  description: '', phone: '', email: '', website: '', address: '',
  google_maps_url: '', lat: '', lng: '', services: '', languages: 'en',
  session_type: 'Individual', pricing: 'Free', stakeholders: '',
  hours: '', verified: 'TRUE', date_added: '', ...overrides,
})

const RESOURCES = [
  makeResource({ id: 'r1', name: 'Cairo Clinic', country: 'Egypt' }),
  makeResource({ id: 'r2', name: 'Beirut NGO', country: 'Lebanon', type: 'NGO' }),
]

describe('ResourceGrid filtering', () => {
  it('shows all resources initially', () => {
    render(<ResourceGrid resources={RESOURCES} />)
    expect(screen.getByText('Cairo Clinic')).toBeInTheDocument()
    expect(screen.getByText('Beirut NGO')).toBeInTheDocument()
  })
  it('filters by search text', () => {
    render(<ResourceGrid resources={RESOURCES} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Cairo' } })
    expect(screen.getByText('Cairo Clinic')).toBeInTheDocument()
    expect(screen.queryByText('Beirut NGO')).not.toBeInTheDocument()
  })
})
