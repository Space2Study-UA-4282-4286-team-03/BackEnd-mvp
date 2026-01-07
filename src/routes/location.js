const express = require('express')
const { getCountries, getCitiesByCountry } = require('~/controllers/location')

const router = express.Router()

router.get('/countries', getCountries)
router.get('/:countryId/cities', getCitiesByCountry)

module.exports = router
