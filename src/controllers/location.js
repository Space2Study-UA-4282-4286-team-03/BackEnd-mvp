const { fetchCountriesFromApi, normalizeCountries } = require('~/services/location')
const { safeGet, safeSetEx } = require('~/services/redisSafe')

const COUNTRIES_CACHE_KEY = 'countries:list'
const COUNTRIES_TTL = 60 * 60 * 24
const CITIES_TTL = 60 * 60 * 24

async function getCountries(req, res) {
  try {
    const cachedCountries = await safeGet(COUNTRIES_CACHE_KEY)
    if (cachedCountries) {
      console.log('Countries cache hit')
      return res.json(JSON.parse(cachedCountries))
    }

    const rawData = await fetchCountriesFromApi()
    const normalized = normalizeCountries(rawData)
    await safeSetEx(COUNTRIES_CACHE_KEY, COUNTRIES_TTL, JSON.stringify(normalized))
    console.log('Countries cache miss - data fetched from API')
    res.json(normalized)
  } catch (e) {
    console.error('Failed to load countries:', e)
    res.status(500).json({ message: 'Failed to load countries' })
  }
}
async function getCitiesByCountry(req, res) {
  try {
    const { countryId } = req.params
    const CITIES_CACHE_KEY = `cities:list:${countryId}`

    const cachedCities = await safeGet(CITIES_CACHE_KEY)
    if (cachedCities) {
      console.log(`Cities cache hit for ${countryId}`)
      return res.json(JSON.parse(cachedCities))
    }

    let countries = await safeGet(COUNTRIES_CACHE_KEY)

    if (countries) {
      countries = JSON.parse(countries)
      console.log('Countries cache hit while fetching cities')
    } else {
      const rawData = await fetchCountriesFromApi()
      countries = normalizeCountries(rawData)
      await safeSetEx(COUNTRIES_CACHE_KEY, COUNTRIES_TTL, JSON.stringify(countries))
      console.log('Countries cache miss while fetching cities')
    }

    const country = countries.find((c) => c.id === countryId)
    if (!country) {
      return res.status(404).json({ message: 'Country not found' })
    }

    const cities = country.cities || []
    await safeSetEx(CITIES_CACHE_KEY, CITIES_TTL, JSON.stringify(cities))
    console.log(`Cities cache miss for ${countryId} - cached now`)

    res.json(cities)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Failed to load cities' })
  }
}
module.exports = {
  getCountries,
  getCitiesByCountry
}
