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
