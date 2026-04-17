import { render, screen } from '@testing-library/react'
import ResourceCard from '@/components/ResourceCard'
import type { Resource } from '@/lib/types'

const mockResource: Resource = {
  id: 'test-clinic', name: 'Test Clinic', country: 'Egypt', type: 'Clinic',
  description: 'A mental health clinic in Cairo.', phone: '+20123456789',
  email: 'info@test.eg', website: 'https://test.eg', address: 'Cairo, Egypt',
  google_maps_url: 'https://maps.google.com', lat: '30.04', lng: '31.23',
  services: 'therapy,counseling', languages: 'ar,en', session_type: 'Individual',
  pricing: 'Free', stakeholders: 'WHO', hours: '9am-5pm', verified: 'TRUE', date_added: '2026-04-17',
}

jest.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en' }),
}))

describe('ResourceCard', () => {
  it('renders the resource name', () => {
    render(<ResourceCard resource={mockResource} />)
    expect(screen.getByText('Test Clinic')).toBeInTheDocument()
  })
  it('renders the country', () => {
    render(<ResourceCard resource={mockResource} />)
    expect(screen.getByText('Egypt')).toBeInTheDocument()
  })
  it('renders the pricing badge', () => {
    render(<ResourceCard resource={mockResource} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })
  it('renders a link to the detail page', () => {
    render(<ResourceCard resource={mockResource} />)
    const link = screen.getByRole('link', { name: /test clinic/i })
    expect(link).toHaveAttribute('href', '/resources/test-clinic')
  })
})
