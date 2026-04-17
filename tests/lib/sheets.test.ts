import { parseResourcesCsv, parseHotlinesCsv } from '@/lib/sheets'

const RESOURCES_CSV = `id,name,country,type,description,phone,email,website,address,google_maps_url,lat,lng,services,languages,session_type,pricing,stakeholders,hours,verified,date_added
nile-center,Nile Center,Egypt,Clinic,Mental health clinic in Cairo,+20123456789,info@nile.eg,https://nile.eg,"Cairo, Egypt",https://maps.google.com,30.0444,31.2357,therapy,ar|en,Individual,Paid,Ministry of Health,9am-5pm,TRUE,2026-04-17`

const HOTLINES_CSV = `country,name,number,hours,languages,notes
Egypt,El-Nada,08008880700,24/7,ar|en,Free hotline`

describe('parseResourcesCsv', () => {
  it('parses a CSV string into Resource objects', () => {
    const resources = parseResourcesCsv(RESOURCES_CSV)
    expect(resources).toHaveLength(1)
    expect(resources[0].name).toBe('Nile Center')
    expect(resources[0].country).toBe('Egypt')
    expect(resources[0].pricing).toBe('Paid')
  })

  it('returns empty array for empty CSV (header only)', () => {
    const resources = parseResourcesCsv('id,name,country\n')
    expect(resources).toHaveLength(0)
  })
})

describe('parseHotlinesCsv', () => {
  it('parses a CSV string into Hotline objects', () => {
    const hotlines = parseHotlinesCsv(HOTLINES_CSV)
    expect(hotlines).toHaveLength(1)
    expect(hotlines[0].country).toBe('Egypt')
    expect(hotlines[0].number).toBe('08008880700')
  })
})
