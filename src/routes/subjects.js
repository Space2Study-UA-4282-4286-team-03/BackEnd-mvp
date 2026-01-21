const express = require('express')
const router = express.Router()
const Subject = require('~/models/subjects')

router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const filter = category ? { category } : {}
    const subjects = await Subject.find(filter, 'title value category').sort({ title: 1 })
    res.json(subjects)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch subjects' })
  }
})

module.exports = router
