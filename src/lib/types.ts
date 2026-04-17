export interface Resource {
  id: string
  name: string
  country: string
  type: string
  description: string
  phone: string
  email: string
  website: string
  address: string
  google_maps_url: string
  lat: string
  lng: string
  services: string
  languages: string
  session_type: string
  pricing: string
  stakeholders: string
  hours: string
  verified: string
  date_added: string
}

export interface Hotline {
  country: string
  name: string
  number: string
  hours: string
  languages: string
  notes: string
}
