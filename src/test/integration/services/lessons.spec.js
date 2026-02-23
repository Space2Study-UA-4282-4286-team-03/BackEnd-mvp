const mongoose = require('mongoose')

const { serverInit, serverCleanup, stopServer } = require('~/test/setup')

const lessonsService = require('~/services/lessons')
const Lesson = require('~/models/lessons')
const Category = require('~/models/resourcesCategory')

describe('Lessons Service – integration', () => {
  let server

  let authorId
  let anotherUserId
  let category

  beforeAll(async () => {
    const init = await serverInit()
    server = init.server
  })

  afterAll(async () => {
    await stopServer(server)
  })

  beforeEach(async () => {
    authorId = new mongoose.Types.ObjectId()
    anotherUserId = new mongoose.Types.ObjectId()

    category = await Category.create({
      name: 'Mathematics',
      author: authorId
    })
  })

  afterEach(async () => {
    await serverCleanup()
  })

  describe('getLessons', () => {
    it('should return lessons list with count', async () => {
      await Lesson.create([
        {
          title: 'Lesson 1',
          files: [],
          category: category._id,
          author: authorId
        },
        {
          title: 'Lesson 2',
          files: [],
          category: category._id,
          author: authorId
        }
      ])

      const result = await lessonsService.getLessons({}, { title: 1 })

      expect(result.items).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.items[0].category).toHaveProperty('name', 'Mathematics')
    })

    it('should return empty list when no lessons match', async () => {
      const result = await lessonsService.getLessons({ author: anotherUserId }, { title: 1 })

      expect(result.items).toHaveLength(0)
      expect(result.count).toBe(0)
    })

    it('should apply skip and limit for pagination', async () => {
      await Lesson.create([
        { title: 'A Lesson', files: [], category: category._id, author: authorId },
        { title: 'B Lesson', files: [], category: category._id, author: authorId },
        { title: 'C Lesson', files: [], category: category._id, author: authorId }
      ])

      const result = await lessonsService.getLessons({}, { title: 1 }, 1, 1)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('B Lesson')
      expect(result.count).toBe(3)
    })

    it('should filter lessons by author', async () => {
      await Lesson.create([
        { title: 'My Lesson', files: [], category: category._id, author: authorId },
        { title: 'Other Lesson', files: [], category: category._id, author: anotherUserId }
      ])

      const result = await lessonsService.getLessons({ author: authorId }, { title: 1 })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('My Lesson')
    })
  })

  describe('getLessonById', () => {
    it('should return lesson by id with populated category', async () => {
      const lesson = await Lesson.create({
        title: 'Find me',
        files: ['file1.pdf'],
        category: category._id,
        author: authorId
      })

      const found = await lessonsService.getLessonById(lesson._id)

      expect(found).toBeDefined()
      expect(found.title).toBe('Find me')
      expect(found.files).toEqual(['file1.pdf'])
      expect(found.category).toHaveProperty('name', 'Mathematics')
    })

    it('should return null for non-existent id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId()

      const found = await lessonsService.getLessonById(nonExistentId)

      expect(found).toBeNull()
    })
  })

  describe('Create new lesson', () => {
    it('Should create new lesson and return it with populated category', async () => {
      const data = { title: 'new lesson', files: ['file.pdf'], category: category._id }

      const result = await lessonsService.createLesson(authorId, data)

      expect(result).toBeDefined()
      expect(result.title).toBe('new lesson')
      expect(result.files).toEqual(['file.pdf'])
      expect(result.author.toString()).toBe(authorId.toString())
      expect(result.category).toHaveProperty('name', 'Mathematics')
    })

    it('Should create new lesson without optional fields', async () => {
      const data = { title: 'minimal lesson' }

      const result = await lessonsService.createLesson(authorId, data)

      expect(result).toBeDefined()
      expect(result.title).toBe('minimal lesson')
      expect(result.files).toEqual([])
    })

    it('Should throw validation error when title is missing', async () => {
      const data = { files: ['file.pdf'] }

      await expect(lessonsService.createLesson(authorId, data)).rejects.toThrow()
    })

    it('Should throw validation error when title exceeds max length', async () => {
      const data = { title: 'A'.repeat(51) }

      await expect(lessonsService.createLesson(authorId, data)).rejects.toThrow()
    })
  })

  describe('Delete lesson', () => {
    it('should delete lesson by id', async () => {
      const lesson = await Lesson.create({
        title: 'To be deleted',
        files: [],
        category: category._id,
        author: authorId
      })
      await lessonsService.deleteLesson(lesson._id, authorId)
      const found = await Lesson.findById(lesson._id).exec()
      expect(found).toBeNull()
    })

    it('should throw NOT_FOUND error when lesson does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId()
      await expect(lessonsService.deleteLesson(nonExistentId, authorId)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('should throw FORBIDDEN error when user is not the author', async () => {
      const lesson = await Lesson.create({
        title: 'Not my lesson',
        files: [],
        category: category._id,
        author: anotherUserId
      })
      await expect(lessonsService.deleteLesson(lesson._id, authorId)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })
})
