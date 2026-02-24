const lessonsService = require('~/services/lessons')
const getCategoriesOptions = require('~/utils/getCategoriesOption')
const getMatchOptions = require('~/utils/getMatchOptions')
const getSortOptions = require('~/utils/getSortOptions')

const getLessons = async (req, res) => {
  const { id: author } = req.user
  const { title, sort, skip, limit, categories } = req.query
  const categoriesOptions = getCategoriesOptions(categories)

  const match = getMatchOptions({
    author,
    title,
    category: categoriesOptions
  })
  const sortOptions = getSortOptions(sort)

  const lessons = await lessonsService.getLessons(
    match,
    sortOptions,
    skip ? parseInt(skip) : undefined,
    limit ? parseInt(limit) : undefined
  )

  res.status(200).json(lessons)
}

const getLessonById = async (req, res) => {
  const { id } = req.params

  const lesson = await lessonsService.getLessonById(id)

  res.status(200).json(lesson)
}

const createLesson = async (req, res) => {
  const { id: author } = req.user
  const data = req.body

  const newLesson = await lessonsService.createLesson(author, data)
  res.status(201).json(newLesson)
}

const deleteLessonById = async (req, res) => {
  const { id } = req.params
  const { id: currentUserId } = req.user
  await lessonsService.deleteLesson(id, currentUserId)
  res.status(204).send()
}

module.exports = {
  getLessons,
  getLessonById,
  createLesson,
  deleteLessonById
}
