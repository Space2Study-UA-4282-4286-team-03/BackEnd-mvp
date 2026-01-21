const router = require('express').Router()
const Subject = require('~/models/subjects')

router.get('/', async (req, res) => {
  try {
    const categories = await Subject.distinct('category')
    res.json(categories)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
})

module.exports = router
