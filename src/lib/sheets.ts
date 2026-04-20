import Papa from 'papaparse'
import type { Resource, Hotline } from './types'

export const revalidate = 60

export function parseResourcesCsv(csv: string): Resource[] {
  const { data } = Papa.parse<Resource>(csv, {
    header: true,
    skipEmptyLines: true,
  })
  return data
}

export function parseHotlinesCsv(csv: string): Hotline[] {
  const { data } = Papa.parse<Hotline>(csv, {
    header: true,
    skipEmptyLines: true,
  })
  return data
}

export async function getResources(): Promise<Resource[]> {
  const url = process.env.NEXT_PUBLIC_RESOURCES_CSV_URL
  if (!url) return []
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const text = await res.text()
    return parseResourcesCsv(text)
  } catch {
    return []
  }
}

export async function getHotlines(): Promise<Hotline[]> {
  const url = process.env.NEXT_PUBLIC_HOTLINES_CSV_URL
  if (!url) return []
  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const text = await res.text()
    return parseHotlinesCsv(text)
  } catch {
    return []
  }
}

export async function getResourceById(id: string): Promise<Resource | undefined> {
  const resources = await getResources()
  return resources.find((r) => r.id === id)
}

export async function getResourcesByCountry(country: string): Promise<Resource[]> {
  const resources = await getResources()
  return resources.filter(
    (r) => r.country.toLowerCase() === country.toLowerCase()
  )
}
