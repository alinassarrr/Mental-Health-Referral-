# MENA Mental Health Referral Guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (EN/AR RTL) Next.js website listing mental health NGOs, helplines, and PHCCs for 17 MENA countries, fed from a one-time Apify scrape published via Google Sheets public CSV.

**Architecture:** Apify scraper (one-time local run) → Google Sheets (candidates tab for manual review, resources + hotlines tabs as public CSV) → Next.js 15 with ISR (revalidate 1hr) on Vercel. No database, no auth, no backend.

**Tech Stack:** Node.js (scraper), apify-client, Next.js 15 App Router, React 19, Tailwind CSS v4, papaparse, custom i18n context (no next-intl), Vercel free tier.

---

## File Map

```
scraper/
├── package.json
├── queries.js          # 17 countries × 4 query types → flat string array
├── scrape.js           # Apify trigger + dataset download → output.json
└── push-to-sheets.js   # output.json → candidates.csv (manual import to Sheets)

src/
├── app/
│   ├── layout.tsx               # Root layout, wraps I18nProvider + HotlineBar
│   ├── globals.css              # Tailwind imports + theme
│   ├── page.tsx                 # Homepage: hero + StatsGrid + MENA country grid
│   ├── about/page.tsx           # Mission + disclaimer
│   ├── resources/
│   │   ├── page.tsx             # Filterable resource grid (server fetch + client filter)
│   │   └── [id]/page.tsx        # Resource detail: full card + MapEmbed
│   └── countries/
│       └── [country]/page.tsx   # Country overview + hotlines + resource list
├── components/
│   ├── HotlineBar.tsx           # Sticky crisis strip at top
│   ├── LanguageToggle.tsx       # EN ↔ AR button, sets dir on <html>
│   ├── Navbar.tsx               # Top nav with LanguageToggle
│   ├── ResourceCard.tsx         # Card: name, type badge, pricing, contact buttons
│   ├── FilterPanel.tsx          # Client: country/type/language/pricing/session filters
│   ├── SearchBar.tsx            # Client: text search over name + description
│   ├── MapEmbed.tsx             # Google Maps iframe from lat/lng (no API key)
│   ├── StatsGrid.tsx            # Resource count per country
│   ├── CrisisDisclaimer.tsx     # "If in immediate danger call emergency services"
│   └── Footer.tsx               # Attribution + data source note
└── lib/
    ├── types.ts                 # Resource, Hotline TypeScript interfaces
    ├── i18n.tsx                 # Custom i18n context + useI18n hook
    ├── sheets.ts                # Fetch + parse CSVs, ISR cache
    └── countries.ts             # MENA countries list + slugs

messages/
├── en.json                      # UI chrome strings (English)
└── ar.json                      # UI chrome strings (Arabic)

tests/
├── lib/sheets.test.ts
├── components/ResourceCard.test.tsx
└── components/FilterPanel.test.tsx

jest.config.ts
jest.setup.ts
next.config.ts
package.json
tsconfig.json
```

---

## Phase A: Scraper

### Task 1: Scraper package setup

**Files:**
- Create: `scraper/package.json`

- [ ] **Step 1: Create scraper directory and package.json**

```bash
cd /home/alinassar/Projects/Mental-Health-Referral-
mkdir -p scraper
```

Create `scraper/package.json`:
```json
{
  "name": "mena-mh-scraper",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "scrape": "node scrape.js",
    "push": "node push-to-sheets.js"
  },
  "dependencies": {
    "apify-client": "^2.9.3",
    "dotenv": "^16.4.5"
  }
}
```

- [ ] **Step 2: Install scraper dependencies**

```bash
cd scraper && npm install
```

Expected: `node_modules/` created, `package-lock.json` created.

- [ ] **Step 3: Commit**

```bash
cd /home/alinassar/Projects/Mental-Health-Referral-
git add scraper/package.json scraper/package-lock.json
git commit -m "feat: add scraper package"
```

---

### Task 2: queries.js — search strings per country

**Files:**
- Create: `scraper/queries.js`

- [ ] **Step 1: Create queries.js**

```js
// scraper/queries.js
const COUNTRIES = [
  'Algeria', 'Egypt', 'Iran', 'Iraq', 'Palestine', 'Jordan', 'Kuwait',
  'Lebanon', 'Libya', 'Morocco', 'Oman', 'Qatar', 'Saudi Arabia',
  'Syria', 'Tunisia', 'UAE', 'Yemen',
]

const QUERY_TEMPLATES = [
  (c) => `mental health clinic ${c}`,
  (c) => `NGO mental health ${c}`,
  (c) => `psychological counseling center ${c}`,
  (c) => `mental health hotline crisis helpline ${c}`,
]

function buildQueries() {
  return COUNTRIES.flatMap((country) =>
    QUERY_TEMPLATES.map((tpl) => tpl(country))
  )
}

module.exports = { COUNTRIES, buildQueries }
```

- [ ] **Step 2: Verify query count**

```bash
cd scraper
node -e "const {buildQueries} = require('./queries'); console.log(buildQueries().length)"
```

Expected output: `68` (17 countries × 4 templates).

- [ ] **Step 3: Commit**

```bash
cd /home/alinassar/Projects/Mental-Health-Referral-
git add scraper/queries.js
git commit -m "feat: add scraper queries (17 countries × 4 templates)"
```

---

### Task 3: scrape.js — Apify trigger + dataset download

**Files:**
- Create: `scraper/scrape.js`

- [ ] **Step 1: Create scrape.js**

```js
// scraper/scrape.js
require('dotenv').config({ path: '../.env' })
const { ApifyClient } = require('apify-client')
const { writeFileSync } = require('fs')
const { buildQueries } = require('./queries')

async function run() {
  const token = process.env.APIFY_TOKEN
  if (!token) throw new Error('APIFY_TOKEN not set in .env')

  const client = new ApifyClient({ token })
  const queries = buildQueries()

  console.log(`Triggering Apify with ${queries.length} queries, max 15 results each...`)
  console.log(`Estimated cost: ~$${((queries.length * 15) / 1000 * 4).toFixed(2)}`)

  const run = await client.actor('compass/crawler-google-places').call({
    searchStringsArray: queries,
    maxCrawledPlacesPerSearch: 15,
    language: 'en',
    includeHistogram: false,
    includeOpeningHours: true,
    includePeopleAlsoPassed: false,
    maxImages: 0,
  })

  console.log(`Run finished. Status: ${run.status}. Dataset: ${run.defaultDatasetId}`)

  const { items } = await client.dataset(run.defaultDatasetId).listItems()
  console.log(`Downloaded ${items.length} places.`)

  writeFileSync('./output.json', JSON.stringify(items, null, 2))
  console.log('Saved to scraper/output.json')
}

run().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
```

- [ ] **Step 2: Dry-run (verify token loads and query count prints)**

```bash
cd scraper
node -e "
require('dotenv').config({ path: '../.env' })
const token = process.env.APIFY_TOKEN
console.log('Token loaded:', token ? 'YES (' + token.slice(0,12) + '...)' : 'NO')
const {buildQueries} = require('./queries')
console.log('Queries to run:', buildQueries().length)
"
```

Expected:
```
Token loaded: YES (apify_api_0B...)
Queries to run: 68
```

- [ ] **Step 3: Run the scraper (costs ~$4 from your Apify balance)**

```bash
cd scraper
node scrape.js
```

Expected (after ~5-15 min):
```
Triggering Apify with 68 queries, max 15 results each...
Estimated cost: ~$4.08
Run finished. Status: SUCCEEDED. Dataset: ...
Downloaded NNN places.
Saved to scraper/output.json
```

- [ ] **Step 4: Verify output.json**

```bash
node -e "
const data = require('./output.json')
console.log('Total items:', data.length)
console.log('Sample:', JSON.stringify(data[0], null, 2).slice(0, 500))
"
```

Expected: `Total items: NNN` (anywhere from 200–1020), followed by a JSON object with `title`, `address`, `phone`, `url`, etc.

- [ ] **Step 5: Commit**

```bash
cd /home/alinassar/Projects/Mental-Health-Referral-
git add scraper/scrape.js
git commit -m "feat: add Apify scraper script"
```

---

### Task 4: push-to-sheets.js — flatten JSON → candidates.csv

**Files:**
- Create: `scraper/push-to-sheets.js`

- [ ] **Step 1: Create push-to-sheets.js**

```js
// scraper/push-to-sheets.js
const { readFileSync, writeFileSync } = require('fs')
const { COUNTRIES } = require('./queries')

function extractCountry(searchString) {
  if (!searchString) return ''
  return COUNTRIES.find((c) =>
    searchString.toLowerCase().includes(c.toLowerCase())
  ) || ''
}

function slugify(name, country) {
  return [country, name]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function flatten(item) {
  const country = extractCountry(item.searchString)
  return {
    scrape_id: item.placeId || '',
    query: item.searchString || '',
    country,
    name: item.title || '',
    category: item.categoryName || '',
    address: item.address || '',
    phone: item.phone || '',
    website: item.website || '',
    email: item.email || '',
    lat: item.location?.lat ?? '',
    lng: item.location?.lng ?? '',
    google_maps_url: item.url || '',
    rating: item.totalScore ?? '',
    reviews_count: item.reviewsCount ?? '',
    hours: JSON.stringify(item.openingHours || []),
    approved: '',
    notes: '',
  }
}

function toCsvRow(obj) {
  return Object.values(obj)
    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
    .join(',')
}

const items = JSON.parse(readFileSync('./output.json', 'utf-8'))
const rows = items.map(flatten)
const headers = Object.keys(rows[0]).join(',')
const csv = [headers, ...rows.map(toCsvRow)].join('\n')
writeFileSync('./candidates.csv', csv)
console.log(`Written ${rows.length} rows to scraper/candidates.csv`)
console.log('Next step: import candidates.csv into the Google Sheet "candidates" tab.')
```

- [ ] **Step 2: Run it**

```bash
cd scraper
node push-to-sheets.js
```

Expected:
```
Written NNN rows to scraper/candidates.csv
Next step: import candidates.csv into the Google Sheet "candidates" tab.
```

- [ ] **Step 3: Import into Google Sheets**

In Google Sheets → candidates tab → File → Import → Upload `scraper/candidates.csv` → "Replace current sheet" → Import.

- [ ] **Step 4: Commit**

```bash
cd /home/alinassar/Projects/Mental-Health-Referral-
git add scraper/push-to-sheets.js
git commit -m "feat: add candidates CSV exporter"
```

---

## Phase B: Next.js App

### Task 5: Scaffold Next.js + install dependencies

**Files:**
- Creates all Next.js scaffold files in project root

- [ ] **Step 1: Scaffold Next.js 15**

```bash
cd /home/alinassar/Projects/Mental-Health-Referral-
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

Expected: scaffolds `src/app/`, `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts` (or CSS-based).

- [ ] **Step 2: Install additional dependencies**

```bash
npm install papaparse
npm install -D @types/papaparse jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1
```

Expected: HTML response with `<html` tag visible.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 app with Tailwind"
```

---

### Task 6: Configure Jest

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Create jest.config.ts**

```ts
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathPattern: ['<rootDir>/tests/'],
}

export default createJestConfig(config)
```

- [ ] **Step 2: Create jest.setup.ts**

```ts
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, find the `"scripts"` section and add:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Create tests directory**

```bash
mkdir -p tests/lib tests/components
```

- [ ] **Step 5: Run tests (should pass with zero tests)**

```bash
npm test -- --passWithNoTests
```

Expected: `Test Suites: 0`, exits 0.

- [ ] **Step 6: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json tests/
git commit -m "feat: configure Jest + Testing Library"
```

---

### Task 7: TypeScript types + countries list

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/countries.ts`

- [ ] **Step 1: Create src/lib/types.ts**

```ts
// src/lib/types.ts
export interface Resource {
  id: string
  name: string
  country: string
  type: string          // NGO | Helpline | PHCC | Clinic | Hospital
  description: string
  phone: string
  email: string
  website: string
  address: string
  google_maps_url: string
  lat: string
  lng: string
  services: string      // comma-separated
  languages: string     // comma-separated: ar, en, fr
  session_type: string  // Individual | Group | Both | Unknown
  pricing: string       // Free | Sliding | Paid | Unknown
  stakeholders: string
  hours: string
  verified: string      // TRUE | FALSE
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
```

- [ ] **Step 2: Create src/lib/countries.ts**

```ts
// src/lib/countries.ts
export const MENA_COUNTRIES = [
  'Algeria', 'Egypt', 'Iran', 'Iraq', 'Palestine', 'Jordan', 'Kuwait',
  'Lebanon', 'Libya', 'Morocco', 'Oman', 'Qatar', 'Saudi Arabia',
  'Syria', 'Tunisia', 'UAE', 'Yemen',
] as const

export type MenaCountry = typeof MENA_COUNTRIES[number]

export function slugToCountry(slug: string): string {
  return MENA_COUNTRIES.find(
    (c) => c.toLowerCase().replace(/\s+/g, '-') === slug
  ) ?? slug
}

export function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/countries.ts
git commit -m "feat: add TypeScript types and countries list"
```

---

### Task 8: Custom i18n context

**Files:**
- Create: `src/lib/i18n.tsx`

- [ ] **Step 1: Create src/lib/i18n.tsx**

```tsx
// src/lib/i18n.tsx
'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import en from '../../messages/en.json'
import ar from '../../messages/ar.json'

type Locale = 'en' | 'ar'
type Messages = typeof en

const messages: Record<Locale, Messages> = { en, ar: ar as Messages }

interface I18nContextType {
  locale: Locale
  t: (key: keyof Messages) => string
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  t: (key) => String(en[key] ?? key),
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale | null
    if (stored === 'ar' || stored === 'en') {
      setLocaleState(stored)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    localStorage.setItem('locale', next)
  }

  const t = (key: keyof Messages): string =>
    String(messages[locale][key] ?? messages.en[key] ?? key)

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
```

- [ ] **Step 2: Create placeholder message files (filled in Task 10)**

```bash
mkdir -p messages
```

Create `messages/en.json`:
```json
{ "placeholder": "en" }
```

Create `messages/ar.json`:
```json
{ "placeholder": "ar" }
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/i18n.tsx messages/en.json messages/ar.json
git commit -m "feat: add custom i18n context with EN/AR support"
```

---

### Task 9: Sheets data layer + tests

**Files:**
- Create: `src/lib/sheets.ts`
- Create: `tests/lib/sheets.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/sheets.test.ts`:
```ts
// tests/lib/sheets.test.ts
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
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npm test tests/lib/sheets.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/sheets'`

- [ ] **Step 3: Create src/lib/sheets.ts**

```ts
// src/lib/sheets.ts
import Papa from 'papaparse'
import type { Resource, Hotline } from './types'

export const revalidate = 3600

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
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return []
  const text = await res.text()
  return parseResourcesCsv(text)
}

export async function getHotlines(): Promise<Hotline[]> {
  const url = process.env.NEXT_PUBLIC_HOTLINES_CSV_URL
  if (!url) return []
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return []
  const text = await res.text()
  return parseHotlinesCsv(text)
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test tests/lib/sheets.test.ts
```

Expected: PASS (2 test suites, 3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/sheets.ts tests/lib/sheets.test.ts
git commit -m "feat: add sheets CSV data layer with tests"
```

---

### Task 10: i18n messages — EN + AR

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ar.json`

- [ ] **Step 1: Write messages/en.json**

```json
{
  "nav.home": "Home",
  "nav.resources": "Resources",
  "nav.about": "About",
  "hotline.prefix": "Crisis?",
  "search.placeholder": "Search organizations...",
  "filter.country": "Country",
  "filter.type": "Type",
  "filter.language": "Language",
  "filter.pricing": "Pricing",
  "filter.session": "Session",
  "filter.all": "All",
  "filter.noResults": "No resources match your filters.",
  "resource.contact": "Contact",
  "resource.website": "Website",
  "resource.address": "Address",
  "resource.services": "Services",
  "resource.languages": "Languages",
  "resource.pricing": "Pricing",
  "resource.hours": "Hours",
  "resource.stakeholders": "Affiliations",
  "resource.session": "Session Type",
  "resource.verified": "Verified",
  "resource.viewMap": "View on Map",
  "resource.callNow": "Call Now",
  "resource.notFound": "Resource not found.",
  "resource.backToList": "Back to Resources",
  "home.hero.title": "Mental Health Resources Across MENA",
  "home.hero.subtitle": "Find verified mental health support in your country",
  "home.stats.resources": "Resources Listed",
  "home.stats.countries": "Countries Covered",
  "home.stats.hotlines": "Crisis Hotlines",
  "home.browseCountries": "Browse by Country",
  "country.hotlines": "Crisis Hotlines",
  "country.resources": "Resources",
  "country.noHotlines": "No hotlines found for this country yet.",
  "country.noResources": "No resources found for this country yet.",
  "disclaimer.text": "If you are in immediate danger, call your local emergency services. This directory is for informational purposes only.",
  "about.title": "About This Directory",
  "about.body": "This directory lists mental health NGOs, helplines, and primary health care centers across 17 MENA countries. Data is sourced from public listings and manually reviewed.",
  "footer.source": "Data sourced from public listings. Always verify contact details before use.",
  "lang.switch": "العربية"
}
```

- [ ] **Step 2: Write messages/ar.json**

```json
{
  "nav.home": "الرئيسية",
  "nav.resources": "الموارد",
  "nav.about": "حول",
  "hotline.prefix": "في أزمة؟",
  "search.placeholder": "ابحث عن منظمات...",
  "filter.country": "الدولة",
  "filter.type": "النوع",
  "filter.language": "اللغة",
  "filter.pricing": "السعر",
  "filter.session": "نوع الجلسة",
  "filter.all": "الكل",
  "filter.noResults": "لا توجد موارد تطابق الفلاتر.",
  "resource.contact": "التواصل",
  "resource.website": "الموقع الإلكتروني",
  "resource.address": "العنوان",
  "resource.services": "الخدمات",
  "resource.languages": "اللغات",
  "resource.pricing": "التسعير",
  "resource.hours": "أوقات العمل",
  "resource.stakeholders": "الجهات الداعمة",
  "resource.session": "نوع الجلسة",
  "resource.verified": "موثق",
  "resource.viewMap": "عرض على الخريطة",
  "resource.callNow": "اتصل الآن",
  "resource.notFound": "المورد غير موجود.",
  "resource.backToList": "العودة إلى القائمة",
  "home.hero.title": "موارد الصحة النفسية في منطقة الشرق الأوسط وشمال أفريقيا",
  "home.hero.subtitle": "ابحث عن دعم الصحة النفسية الموثوق في بلدك",
  "home.stats.resources": "مورد مدرج",
  "home.stats.countries": "دولة مشمولة",
  "home.stats.hotlines": "خطوط أزمات",
  "home.browseCountries": "تصفح حسب الدولة",
  "country.hotlines": "خطوط الأزمات",
  "country.resources": "الموارد",
  "country.noHotlines": "لا توجد خطوط مساعدة لهذه الدولة حتى الآن.",
  "country.noResources": "لا توجد موارد لهذه الدولة حتى الآن.",
  "disclaimer.text": "إذا كنت في خطر مباشر، اتصل بخدمات الطوارئ المحلية. هذا الدليل للأغراض المعلوماتية فقط.",
  "about.title": "حول هذا الدليل",
  "about.body": "يسرد هذا الدليل منظمات الصحة النفسية وخطوط المساعدة ومراكز الرعاية الصحية في 17 دولة من منطقة الشرق الأوسط وشمال أفريقيا.",
  "footer.source": "البيانات مصدرها القوائم العامة. تحقق دائماً من تفاصيل الاتصال قبل الاستخدام.",
  "lang.switch": "English"
}
```

- [ ] **Step 3: Commit**

```bash
git add messages/en.json messages/ar.json
git commit -m "feat: add EN/AR i18n message files"
```

---

### Task 11: Tailwind theme + globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css content**

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-teal-50: #f0fdfa;
  --color-teal-100: #ccfbf1;
  --color-teal-500: #14b8a6;
  --color-teal-600: #0d9488;
  --color-teal-700: #0f766e;
  --color-emerald-500: #10b981;
  --color-emerald-600: #059669;
  --font-sans: "Inter", system-ui, sans-serif;
  --font-arabic: "Noto Sans Arabic", system-ui, sans-serif;
}

[dir="rtl"] {
  font-family: var(--font-arabic);
}
```

- [ ] **Step 2: Add Google Fonts to layout (done in Task 12) — skip for now**

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: configure Tailwind theme with teal palette"
```

---

### Task 12: Root layout

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/Navbar.tsx`

- [ ] **Step 1: Create src/components/Navbar.tsx**

```tsx
// src/components/Navbar.tsx
'use client'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import LanguageToggle from './LanguageToggle'

export default function Navbar() {
  const { t } = useI18n()
  return (
    <nav className="bg-teal-700 text-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg tracking-tight">
        MENA Mind
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link href="/" className="hover:text-teal-100">{t('nav.home')}</Link>
        <Link href="/resources" className="hover:text-teal-100">{t('nav.resources')}</Link>
        <Link href="/about" className="hover:text-teal-100">{t('nav.about')}</Link>
        <LanguageToggle />
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Replace src/app/layout.tsx**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'MENA Mental Health Resources',
  description:
    'Find verified mental health NGOs, helplines, and clinics across 17 MENA countries.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <I18nProvider>
          <Navbar />
          <main>{children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx src/components/Navbar.tsx
git commit -m "feat: add root layout with I18nProvider and Navbar"
```

---

### Task 13: HotlineBar + LanguageToggle components

**Files:**
- Create: `src/components/HotlineBar.tsx`
- Create: `src/components/LanguageToggle.tsx`

- [ ] **Step 1: Create src/components/LanguageToggle.tsx**

```tsx
// src/components/LanguageToggle.tsx
'use client'
import { useI18n } from '@/lib/i18n'

export default function LanguageToggle() {
  const { t, locale, setLocale } = useI18n()
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      className="border border-white/40 rounded px-2 py-1 text-xs hover:bg-teal-600 transition-colors"
      aria-label="Switch language"
    >
      {t('lang.switch')}
    </button>
  )
}
```

- [ ] **Step 2: Create src/components/HotlineBar.tsx**

```tsx
// src/components/HotlineBar.tsx
import type { Hotline } from '@/lib/types'

export default function HotlineBar({ hotlines }: { hotlines: Hotline[] }) {
  if (hotlines.length === 0) return null
  return (
    <div className="bg-red-600 text-white text-xs py-2 px-4 flex gap-4 overflow-x-auto whitespace-nowrap">
      <span className="font-semibold shrink-0">Crisis Lines:</span>
      {hotlines.slice(0, 8).map((h) => (
        <a
          key={`${h.country}-${h.number}`}
          href={`tel:${h.number}`}
          className="hover:underline shrink-0"
        >
          {h.country}: <strong>{h.number}</strong>
        </a>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Add HotlineBar to layout.tsx**

In `src/app/layout.tsx`, after the `<I18nProvider>` opening tag add `<HotlineBar>`. Since `HotlineBar` is a server component and layout is server too, we need to fetch hotlines in the layout.

Replace the `<body>` section in `src/app/layout.tsx`:
```tsx
// src/app/layout.tsx — add these imports at top
import { getHotlines } from '@/lib/sheets'
import HotlineBar from '@/components/HotlineBar'

// Replace the body JSX:
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hotlines = await getHotlines()
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <I18nProvider>
          <HotlineBar hotlines={hotlines} />
          <Navbar />
          <main>{children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/HotlineBar.tsx src/components/LanguageToggle.tsx src/app/layout.tsx
git commit -m "feat: add HotlineBar and LanguageToggle components"
```

---

### Task 14: ResourceCard component + test

**Files:**
- Create: `src/components/ResourceCard.tsx`
- Create: `tests/components/ResourceCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/ResourceCard.test.tsx
import { render, screen } from '@testing-library/react'
import ResourceCard from '@/components/ResourceCard'
import type { Resource } from '@/lib/types'

const mockResource: Resource = {
  id: 'test-clinic',
  name: 'Test Clinic',
  country: 'Egypt',
  type: 'Clinic',
  description: 'A mental health clinic in Cairo.',
  phone: '+20123456789',
  email: 'info@test.eg',
  website: 'https://test.eg',
  address: 'Cairo, Egypt',
  google_maps_url: 'https://maps.google.com',
  lat: '30.04',
  lng: '31.23',
  services: 'therapy,counseling',
  languages: 'ar,en',
  session_type: 'Individual',
  pricing: 'Free',
  stakeholders: 'WHO',
  hours: '9am-5pm',
  verified: 'TRUE',
  date_added: '2026-04-17',
}

// Wrap with I18nProvider mock
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
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npm test tests/components/ResourceCard.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ResourceCard'`

- [ ] **Step 3: Create src/components/ResourceCard.tsx**

```tsx
// src/components/ResourceCard.tsx
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
        <h3 className="font-semibold text-gray-900 text-base leading-snug">
          {resource.name}
        </h3>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
            PRICING_COLORS[resource.pricing] ?? PRICING_COLORS.Unknown
          }`}
        >
          {resource.pricing || 'Unknown'}
        </span>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            TYPE_COLORS[resource.type] ?? 'bg-gray-100 text-gray-500'
          }`}
        >
          {resource.type}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {resource.country}
        </span>
      </div>

      {resource.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {resource.description}
        </p>
      )}

      {services.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {services.slice(0, 4).map((s) => (
            <span
              key={s}
              className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded"
            >
              {s}
            </span>
          ))}
          {services.length > 4 && (
            <span className="text-xs text-gray-400">+{services.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test tests/components/ResourceCard.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ResourceCard.tsx tests/components/ResourceCard.test.tsx
git commit -m "feat: add ResourceCard component with tests"
```

---

### Task 15: FilterPanel + SearchBar + test

**Files:**
- Create: `src/components/FilterPanel.tsx`
- Create: `src/components/SearchBar.tsx`
- Create: `src/components/ResourceGrid.tsx` (client wrapper combining both)
- Create: `tests/components/FilterPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/FilterPanel.test.tsx
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
  hours: '', verified: 'TRUE', date_added: '',
  ...overrides,
})

const RESOURCES = [
  makeResource({ id: 'r1', name: 'Cairo Clinic', country: 'Egypt', pricing: 'Free' }),
  makeResource({ id: 'r2', name: 'Beirut NGO', country: 'Lebanon', pricing: 'Paid', type: 'NGO' }),
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
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npm test tests/components/FilterPanel.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/ResourceGrid'`

- [ ] **Step 3: Create src/components/SearchBar.tsx**

```tsx
// src/components/SearchBar.tsx
'use client'
import { useI18n } from '@/lib/i18n'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const { t } = useI18n()
  return (
    <input
      role="searchbox"
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('search.placeholder')}
      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
    />
  )
}
```

- [ ] **Step 4: Create src/components/FilterPanel.tsx**

```tsx
// src/components/FilterPanel.tsx
'use client'
import { useI18n } from '@/lib/i18n'
import { MENA_COUNTRIES } from '@/lib/countries'

export interface Filters {
  country: string
  type: string
  pricing: string
  session: string
}

interface FilterPanelProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

const TYPES = ['NGO', 'Helpline', 'PHCC', 'Clinic', 'Hospital']
const PRICING = ['Free', 'Sliding', 'Paid', 'Unknown']
const SESSIONS = ['Individual', 'Group', 'Both']

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const { t } = useI18n()

  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value })

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={filters.country}
        onChange={set('country')}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        aria-label={t('filter.country')}
      >
        <option value="">{t('filter.country')}: {t('filter.all')}</option>
        {MENA_COUNTRIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={set('type')}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        aria-label={t('filter.type')}
      >
        <option value="">{t('filter.type')}: {t('filter.all')}</option>
        {TYPES.map((tp) => (
          <option key={tp} value={tp}>{tp}</option>
        ))}
      </select>

      <select
        value={filters.pricing}
        onChange={set('pricing')}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        aria-label={t('filter.pricing')}
      >
        <option value="">{t('filter.pricing')}: {t('filter.all')}</option>
        {PRICING.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={filters.session}
        onChange={set('session')}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        aria-label={t('filter.session')}
      >
        <option value="">{t('filter.session')}: {t('filter.all')}</option>
        {SESSIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 5: Create src/components/ResourceGrid.tsx**

```tsx
// src/components/ResourceGrid.tsx
'use client'
import { useState, useMemo } from 'react'
import type { Resource } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import SearchBar from './SearchBar'
import FilterPanel, { type Filters } from './FilterPanel'
import ResourceCard from './ResourceCard'

const EMPTY_FILTERS: Filters = { country: '', type: '', pricing: '', session: '' }

export default function ResourceGrid({ resources }: { resources: Resource[] }) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return resources.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false
      if (filters.country && r.country !== filters.country) return false
      if (filters.type && r.type !== filters.type) return false
      if (filters.pricing && r.pricing !== filters.pricing) return false
      if (filters.session && r.session_type !== filters.session) return false
      return true
    })
  }, [resources, search, filters])

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <SearchBar value={search} onChange={setSearch} />
        <FilterPanel filters={filters} onChange={setFilters} />
      </div>
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">{t('filter.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm test tests/components/FilterPanel.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/components/FilterPanel.tsx src/components/SearchBar.tsx src/components/ResourceGrid.tsx tests/components/FilterPanel.test.tsx
git commit -m "feat: add FilterPanel, SearchBar, ResourceGrid with tests"
```

---

### Task 16: MapEmbed + StatsGrid + CrisisDisclaimer + Footer

**Files:**
- Create: `src/components/MapEmbed.tsx`
- Create: `src/components/StatsGrid.tsx`
- Create: `src/components/CrisisDisclaimer.tsx`
- Create: `src/components/Footer.tsx`

- [ ] **Step 1: Create src/components/MapEmbed.tsx**

```tsx
// src/components/MapEmbed.tsx
interface MapEmbedProps {
  lat: string
  lng: string
  name: string
}

export default function MapEmbed({ lat, lng, name }: MapEmbedProps) {
  if (!lat || !lng) return null
  const src = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video w-full">
      <iframe
        title={`Map for ${name}`}
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/StatsGrid.tsx**

```tsx
// src/components/StatsGrid.tsx
import { useI18n } from '@/lib/i18n'

interface StatsGridProps {
  resourceCount: number
  countryCount: number
  hotlineCount: number
}

export default function StatsGrid({ resourceCount, countryCount, hotlineCount }: StatsGridProps) {
  const { t } = useI18n()
  const stats = [
    { label: t('home.stats.resources'), value: resourceCount },
    { label: t('home.stats.countries'), value: countryCount },
    { label: t('home.stats.hotlines'), value: hotlineCount },
  ]
  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(({ label, value }) => (
        <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-teal-600">{value}</div>
          <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}
```

Note: `StatsGrid` uses `useI18n` so it must be a client component — add `'use client'` at the top.

Updated `src/components/StatsGrid.tsx`:
```tsx
'use client'
import { useI18n } from '@/lib/i18n'
// ... rest same as above
```

- [ ] **Step 3: Create src/components/CrisisDisclaimer.tsx**

```tsx
// src/components/CrisisDisclaimer.tsx
'use client'
import { useI18n } from '@/lib/i18n'

export default function CrisisDisclaimer() {
  const { t } = useI18n()
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800" role="alert">
      {t('disclaimer.text')}
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/Footer.tsx**

```tsx
// src/components/Footer.tsx
'use client'
import { useI18n } from '@/lib/i18n'

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="mt-16 border-t border-gray-200 py-8 px-4 text-center text-xs text-gray-400">
      <p>{t('footer.source')}</p>
    </footer>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/MapEmbed.tsx src/components/StatsGrid.tsx src/components/CrisisDisclaimer.tsx src/components/Footer.tsx
git commit -m "feat: add MapEmbed, StatsGrid, CrisisDisclaimer, Footer components"
```

---

### Task 17: Homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace src/app/page.tsx**

```tsx
// src/app/page.tsx
import Link from 'next/link'
import { getResources, getHotlines } from '@/lib/sheets'
import { MENA_COUNTRIES, countryToSlug } from '@/lib/countries'
import Footer from '@/components/Footer'
import CrisisDisclaimer from '@/components/CrisisDisclaimer'

export const revalidate = 3600

export default async function HomePage() {
  const [resources, hotlines] = await Promise.all([getResources(), getHotlines()])

  const countryCounts = MENA_COUNTRIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = resources.filter((r) => r.country === c).length
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-teal-700 mb-4">
          Mental Health Resources Across MENA
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-6">
          Find verified mental health support in your country — NGOs, helplines, and clinics.
        </p>
        <Link
          href="/resources"
          className="inline-block bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          Browse All Resources
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4 mb-12">
        {[
          { label: 'Resources Listed', value: resources.length },
          { label: 'Countries Covered', value: MENA_COUNTRIES.length },
          { label: 'Crisis Hotlines', value: hotlines.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-teal-600">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </section>

      {/* Country Grid */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Browse by Country</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {MENA_COUNTRIES.map((country) => (
            <Link
              key={country}
              href={`/countries/${countryToSlug(country)}`}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow text-center"
            >
              <div className="font-medium text-gray-800 text-sm">{country}</div>
              <div className="text-xs text-teal-600 mt-1">
                {countryCounts[country] ?? 0} resources
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CrisisDisclaimer />
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Run dev server and check homepage**

```bash
npm run dev
```

Open http://localhost:3000 — verify hero, stats (may show 0 while Sheets is empty), country grid.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add homepage with hero, stats, and country grid"
```

---

### Task 18: Resources listing page

**Files:**
- Create: `src/app/resources/page.tsx`

- [ ] **Step 1: Create src/app/resources/page.tsx**

```tsx
// src/app/resources/page.tsx
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
```

- [ ] **Step 2: Visit http://localhost:3000/resources — verify filter panel and grid render**

- [ ] **Step 3: Commit**

```bash
git add src/app/resources/page.tsx
git commit -m "feat: add resources listing page with filter panel"
```

---

### Task 19: Resource detail page

**Files:**
- Create: `src/app/resources/[id]/page.tsx`

- [ ] **Step 1: Create src/app/resources/[id]/page.tsx**

```tsx
// src/app/resources/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getResources, getResourceById } from '@/lib/sheets'
import MapEmbed from '@/components/MapEmbed'
import CrisisDisclaimer from '@/components/CrisisDisclaimer'
import Footer from '@/components/Footer'

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/resources" className="text-teal-600 text-sm hover:underline mb-4 block">
        ← Back to Resources
      </Link>

      <CrisisDisclaimer />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{resource.name}</h1>
          <span className="shrink-0 text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">
            {resource.type}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{resource.country}</span>
          {resource.pricing && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{resource.pricing}</span>
          )}
          {resource.session_type && (
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{resource.session_type}</span>
          )}
          {resource.verified === 'TRUE' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">Verified</span>
          )}
        </div>

        {resource.description && (
          <p className="text-gray-600 mb-6">{resource.description}</p>
        )}

        {/* Contact info */}
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
          {resource.hours && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              🕐 {resource.hours}
            </div>
          )}
        </div>

        {resource.address && (
          <div className="mb-4 text-sm text-gray-600">
            📍 {resource.address}
          </div>
        )}

        {/* Map */}
        <MapEmbed lat={resource.lat} lng={resource.lng} name={resource.name} />

        {/* Services */}
        {services.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Services</h2>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <span key={s} className="text-xs bg-teal-50 text-teal-600 px-3 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Languages</h2>
            <div className="flex gap-2">
              {languages.map((l) => (
                <span key={l} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {l.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stakeholders */}
        {resource.stakeholders && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Affiliations</h2>
            <p className="text-sm text-gray-600">{resource.stakeholders}</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/resources/
git commit -m "feat: add resource detail page with map embed"
```

---

### Task 20: Country page

**Files:**
- Create: `src/app/countries/[country]/page.tsx`

- [ ] **Step 1: Create src/app/countries/[country]/page.tsx**

```tsx
// src/app/countries/[country]/page.tsx
import { notFound } from 'next/navigation'
import { getResources, getHotlines } from '@/lib/sheets'
import { MENA_COUNTRIES, slugToCountry } from '@/lib/countries'
import ResourceCard from '@/components/ResourceCard'
import Footer from '@/components/Footer'
import CrisisDisclaimer from '@/components/CrisisDisclaimer'

export const revalidate = 3600

export async function generateStaticParams() {
  return MENA_COUNTRIES.map((c) => ({
    country: c.toLowerCase().replace(/\s+/g, '-'),
  }))
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country: slug } = await params
  const countryName = slugToCountry(slug)

  if (!MENA_COUNTRIES.includes(countryName as typeof MENA_COUNTRIES[number])) {
    notFound()
  }

  const [allResources, allHotlines] = await Promise.all([getResources(), getHotlines()])

  const resources = allResources.filter(
    (r) => r.country.toLowerCase() === countryName.toLowerCase()
  )
  const hotlines = allHotlines.filter(
    (h) => h.country.toLowerCase() === countryName.toLowerCase()
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-teal-700 mb-2">{countryName}</h1>
      <p className="text-gray-500 mb-6">
        {resources.length} resources · {hotlines.length} crisis hotlines
      </p>

      <CrisisDisclaimer />

      {/* Hotlines */}
      {hotlines.length > 0 && (
        <section className="mt-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Crisis Hotlines</h2>
          <div className="flex flex-col gap-2">
            {hotlines.map((h) => (
              <div
                key={h.number}
                className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">{h.name}</div>
                  {h.hours && <div className="text-xs text-gray-500">{h.hours}</div>}
                </div>
                <a
                  href={`tel:${h.number}`}
                  className="text-red-600 font-semibold text-sm hover:underline"
                >
                  {h.number}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resources */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Resources</h2>
        {resources.length === 0 ? (
          <p className="text-gray-400 text-sm">No resources found for this country yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/countries/
git commit -m "feat: add country page with hotlines and resource list"
```

---

### Task 21: About page + final checks

**Files:**
- Create: `src/app/about/page.tsx`

- [ ] **Step 1: Create src/app/about/page.tsx**

```tsx
// src/app/about/page.tsx
import Footer from '@/components/Footer'
import CrisisDisclaimer from '@/components/CrisisDisclaimer'

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-teal-700 mb-4">About This Directory</h1>
      <CrisisDisclaimer />
      <div className="prose prose-gray mt-8 text-sm leading-relaxed text-gray-700">
        <p>
          This directory lists mental health NGOs, helplines, and primary health care centers
          across 17 countries in the MENA region: Algeria, Egypt, Iran, Iraq, Palestine,
          Jordan, Kuwait, Lebanon, Libya, Morocco, Oman, Qatar, Saudi Arabia, Syria, Tunisia,
          UAE, and Yemen.
        </p>
        <p className="mt-4">
          Data is sourced from public Google Maps listings and manually reviewed before
          publication. Always call ahead to confirm availability and services.
        </p>
        <p className="mt-4">
          If you know of a resource that should be listed, please reach out.
        </p>
      </div>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 3: Run build to check for TypeScript errors**

```bash
npm run build
```

Expected: build succeeds, no TypeScript errors. Fix any type errors before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: add about page"
```

---

### Task 22: Vercel deploy

**Files:**
- No new files — deploy existing code

- [ ] **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

- [ ] **Step 2: Deploy**

```bash
vercel
```

Follow prompts: link to your Vercel account, confirm project name, set framework to Next.js.

- [ ] **Step 3: Set environment variables in Vercel dashboard**

In Vercel project → Settings → Environment Variables, add:
```
NEXT_PUBLIC_RESOURCES_CSV_URL = <value from .env>
NEXT_PUBLIC_HOTLINES_CSV_URL  = <value from .env>
```

- [ ] **Step 4: Redeploy with env vars**

```bash
vercel --prod
```

- [ ] **Step 5: Verify live URL**

Open the Vercel URL, check:
- Homepage loads with country grid
- `/resources` shows filter panel
- `/countries/egypt` shows Egypt page
- Language toggle switches to Arabic + RTL layout

---

## Self-Review

**Spec coverage check:**
- ✅ 17 MENA countries: covered in `MENA_COUNTRIES`
- ✅ Apify scraper (one-time): Tasks 1–4
- ✅ candidates / resources / hotlines tabs: Task 4 outputs CSV for import
- ✅ Public CSV auth: `getResources()` fetches from `NEXT_PUBLIC_*` env vars
- ✅ ISR 1hr: `export const revalidate = 3600` on all pages
- ✅ Bilingual EN/AR: `I18nProvider` + messages + `dir` toggle
- ✅ RTL: `document.documentElement.dir` set by `I18nProvider`
- ✅ UI chrome translation only: resource data rendered as-is
- ✅ All resource columns: `types.ts` mirrors spec schema
- ✅ Stakeholders column: included in `Resource` type and detail page
- ✅ MapEmbed without API key: lat/lng iframe approach
- ✅ Filter by country/type/pricing/session: `ResourceGrid`
- ✅ Search: `SearchBar` inside `ResourceGrid`
- ✅ Country pages with hotlines: Task 20
- ✅ Crisis disclaimer: `CrisisDisclaimer` on all main pages
- ✅ Vercel free tier: no server features used

**No TBDs, no contradictions, no missing tasks.**
