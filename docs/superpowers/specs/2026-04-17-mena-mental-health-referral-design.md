# MENA Mental Health Referral Guide — Design Spec
Date: 2026-04-17

## Problem
People in the MENA region seeking mental health support have no single, structured, accessible directory of NGOs, helplines, and PHCCs. Resources are scattered, often in wrong languages, and hard to contact.

## Goal
A fast, bilingual (EN/AR) public website that acts as a referral sheet — listing verified mental health resources across 17 MENA countries with contact info, services, location, and pricing.

---

## Countries
Algeria, Egypt, Iran, Iraq, Palestine, Jordan, Kuwait, Lebanon, Libya, Morocco, Oman, Qatar, Saudi Arabia, Syria, Tunisia, UAE, Yemen

---

## System Architecture

```
[ One-time ]            [ Manual, ongoing ]          [ Automated ]
  Apify        ──►   Google Sheet (3 tabs)     ──►   Next.js on Vercel
  scraper              candidates (raw)               fetch CSV
  EN queries           resources (curated)            ISR revalidate 1hr
  ~$4 budget           hotlines (scraped)             EN/AR RTL toggle
                       ↓
                  published as public CSV
                  (no auth, no DB, no backend)
```

**Key property:** scraper runs once locally, is retired after. Day-2 edits happen directly in Google Sheets.

---

## Phase 1 — Scraper

### Files
```
scraper/
├── queries.js         # 17 countries × 4 query types
├── scrape.js          # Apify trigger + dataset download
├── push-to-sheets.js  # flatten JSON → append rows to candidates tab
└── .env               # APIFY_TOKEN, SHEET_WEBHOOK_URL
```

### Apify Actor
- Actor: `compass/crawler-google-places`
- Max results per query: `20` (EN) → dropped to `15` to stay under $5
- Language: `en`

### Query Types Per Country (4 total)
1. `"mental health clinic" [country]`
2. `"NGO mental health" [country]`
3. `"psychological counseling" [country]`
4. `"mental health hotline" OR "crisis helpline" [country]`

Budget: 17 × 4 × 15 = 1,020 results → ~$4.08 at $4/1K ✓

### Data Rule
All data in the sheet — including hotlines — comes exclusively from Apify scraping. No pre-seeded or manually invented rows. If Apify doesn't return a result for a country, that country has no entry.

---

## Phase 2 — Google Sheets Schema

### Tab 1: `candidates` (Apify writes here)
| Col | Field | Description |
|-----|-------|-------------|
| A | scrape_id | Apify record ID |
| B | query | search string used |
| C | country | derived from query |
| D | name | place name |
| E | category | Google Maps category |
| F | address | full address |
| G | phone | primary phone |
| H | website | URL |
| I | email | if available |
| J | lat | latitude |
| K | lng | longitude |
| L | google_maps_url | direct link |
| M | rating | stars |
| N | reviews_count | review count |
| O | hours | opening hours |
| P | approved | you set TRUE to promote |
| Q | notes | your review notes |

### Tab 2: `resources` (curated — feeds website)
| Col | Field | Notes |
|-----|-------|-------|
| A | id | slug |
| B | name | org/center name |
| C | country | from 17-country list |
| D | type | NGO / Helpline / PHCC / Clinic / Hospital |
| E | description | goals / mission |
| F | phone | |
| G | email | |
| H | website | |
| I | address | |
| J | google_maps_url | for map embed |
| K | lat | |
| L | lng | |
| M | services | comma-separated |
| N | languages | comma-separated (ar, en, fr) |
| O | session_type | Individual / Group / Both / Unknown |
| P | pricing | Free / Sliding / Paid / Unknown |
| Q | stakeholders | funders / affiliations |
| R | hours | free-text |
| S | verified | TRUE / FALSE |
| T | date_added | ISO date |

### Tab 3: `hotlines` (scraped — feeds website)
| Col | Field |
|-----|-------|
| A | country |
| B | name |
| C | number |
| D | hours |
| E | languages |
| F | notes |

### CSV URLs (already live)
- resources: `https://docs.google.com/spreadsheets/d/e/2PACX-1vTgRKO072u-37UkHl4QKQ65e_HkDlSKHAneE0PMRAc63BVrMFg1tVQo8ZK3uUSsAv7voSODR8Fa-1OQ/pub?gid=0&single=true&output=csv`
- hotlines: `https://docs.google.com/spreadsheets/d/e/2PACX-1vTgRKO072u-37UkHl4QKQ65e_HkDlSKHAneE0PMRAc63BVrMFg1tVQo8ZK3uUSsAv7voSODR8Fa-1OQ/pub?gid=424703666&single=true&output=csv`

---

## Phase 3 — Next.js Website

### Stack
- Next.js 15 (App Router)
- Tailwind CSS
- next-intl (EN/AR i18n, RTL)
- papaparse (CSV parsing)
- No database, no auth, no server-side writes

### Routes
| Route | Description |
|-------|-------------|
| `/` | Hero + MENA map + hotline strip + country stats |
| `/resources` | Filterable grid: country, type, language, pricing, session type |
| `/resources/[id]` | Full detail: map embed + contact buttons + services tags |
| `/countries/[country]` | Country overview + local hotlines + resource list |
| `/about` | Mission + disclaimer + contribute |

### Components
- `LanguageToggle` — switches EN/AR, flips `dir` on `<html>`
- `HotlineBar` — sticky top strip showing crisis numbers
- `ResourceCard` — card with name, type, country, pricing badge, contact
- `FilterPanel` — country, type, language, pricing, session type filters
- `SearchBar` — client-side text search over name + description
- `MapEmbed` — Google Maps iframe (no API key, uses place URL)
- `StatsGrid` — resource count per country
- `CrisisDisclaimer` — "If in immediate danger call emergency services" banner
- `Footer` — links + data source attribution

### Data Fetching
```ts
// lib/sheets.ts
export const revalidate = 3600

export async function getResources(): Promise<Resource[]> {
  const res = await fetch(process.env.NEXT_PUBLIC_RESOURCES_CSV_URL!)
  const text = await res.text()
  return Papa.parse(text, { header: true }).data as Resource[]
}
```

### i18n
- `next-intl` with `en` and `ar` locales
- `messages/en.json` and `messages/ar.json` for UI chrome only
- Resource data rendered as-is (not translated)
- `dir="rtl"` applied to `<html>` when locale is `ar`

### Styling
- Tailwind CSS, calming teal/green palette (`teal-600`, `emerald-500`)
- Mobile-first, fully responsive
- ARIA labels on all interactive elements

---

## Caching Strategy
- `export const revalidate = 3600` on all data-fetching server components
- Static HTML generated at build time, refreshed every 1 hour in background
- No client-side fetching except search/filter (operates on pre-loaded data)

---

## Deployment
- Vercel free tier (no server, no DB, no paid features needed)
- Env vars set in Vercel dashboard (same as `.env`)
- Trigger redeploy manually after major Sheets updates if immediate refresh needed

---

## Out of Scope (v1)
- User submissions / "suggest a resource" form
- French (FR) language support
- Admin dashboard
- Email/SMS alerts
- Automated Sheets sync (webhook)
