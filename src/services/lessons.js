const Lesson = require('~/models/lessons')
const { createForbiddenError, createNotFoundError } = require('~/utils/errorsHelper')

const lessonsService = {
  getLessons: async (match, sort, skip = 0, limit = 10) => {
    const items = await Lesson.find(match)
      .collation({ locale: 'en', strength: 1 })
      .populate({ path: 'category', select: '_id name' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()
    const count = await Lesson.countDocuments(match)

    return { items, count }
  },

  getLessonById: async (id) => {
    return await Lesson.findById(id).populate({ path: 'category', select: '_id name' }).lean().exec()
  },

  createLesson: async (author, data) => {
    const { title, files, category } = data

    const lesson = await Lesson.create({
      title,
      files,
      category,
      author
    })

    return await lesson.populate({ path: 'category', select: '_id name' })
  },

  updateLesson: async (id, currentUserId, data) => {
    const lesson = await Lesson.findById(id).exec()
    if (!lesson) {
      throw createNotFoundError()
    }

    const author = lesson.author.toString()

    if (author !== currentUserId) {
      throw createForbiddenError()
    }
    const allowedFields = ['title', 'files', 'category']

    for (const field of Object.keys(data)) {
      if (allowedFields.includes(field)) {
        lesson[field] = data[field]
      }
    }

    lesson.lastUpdated = Date.now()

    await lesson.save()
    return lesson.populate({ path: 'category', select: '_id name' })
  },

  deleteLesson: async (id, currentUserId) => {
    const lesson = await Lesson.findById(id).exec()

    if (!lesson) {
      throw createNotFoundError()
    }

    const author = lesson.author.toString()

    if (author !== currentUserId) {
      throw createForbiddenError()
    }

    await Lesson.findByIdAndDelete(id).exec()
  }
}

module.exports = lessonsService
