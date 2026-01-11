const mongoose = require('mongoose')

const { serverInit, serverCleanup, stopServer } = require('~/test/setup')

const questionService = require('~/services/question')
const Question = require('~/models/question')
const Category = require('~/models/resourcesCategory')

describe('Question Service – integration', () => {
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
      name: 'Science',
      author: authorId
    })
  })

  afterEach(async () => {
    await serverCleanup()
  })

  const validAnswers = [
    { text: 'Answer A', isCorrect: true },
    { text: 'Answer B', isCorrect: false }
  ]

  describe('createQuestion', () => {
    it('should create question and populate category', async () => {
      const data = {
        title: 'Test question',
        text: 'Some text',
        answers: validAnswers,
        type: 'oneAnswer',
        category: category._id
      }

      const question = await questionService.createQuestion(authorId, data)

      expect(question).toBeDefined()
      expect(question.title).toBe('Test question')
      expect(question.author.toString()).toBe(authorId.toString())
      expect(question.category).toHaveProperty('name', 'Science')
    })
  })

  describe('getQuestions', () => {
    it('should return questions list with count', async () => {
      await Question.create([
        {
          title: 'Q1',
          text: 'Text',
          answers: validAnswers,
          type: 'oneAnswer',
          category: category._id,
          author: authorId
        },
        {
          title: 'Q2',
          text: 'Text',
          answers: validAnswers,
          type: 'oneAnswer',
          category: category._id,
          author: authorId
        }
      ])

      const result = await questionService.getQuestions({}, { title: 1 })

      expect(result.items).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.items[0].category).toHaveProperty('name', 'Science')
    })
  })

  describe('getQuestionById', () => {
    it('should return question by id', async () => {
      const question = await Question.create({
        title: 'Find me',
        text: 'Text',
        answers: validAnswers,
        type: 'oneAnswer',
        category: category._id,
        author: authorId
      })

      const found = await questionService.getQuestionById(question._id)

      expect(found).toBeDefined()
      expect(found.title).toBe('Find me')
    })
  })

  describe('deleteQuestion', () => {
    it('should delete question if author matches', async () => {
      const question = await Question.create({
        title: 'Delete me',
        text: 'Text',
        answers: validAnswers,
        type: 'oneAnswer',
        category: category._id,
        author: authorId
      })

      await questionService.deleteQuestion(question._id, authorId.toString())

      const deleted = await Question.findById(question._id)
      expect(deleted).toBeNull()
    })

    it('should throw forbidden error if author does not match', async () => {
      const question = await Question.create({
        title: 'Protected',
        text: 'Text',
        answers: validAnswers,
        type: 'oneAnswer',
        category: category._id,
        author: authorId
      })

      await expect(questionService.deleteQuestion(question._id, anotherUserId.toString())).rejects.toThrow()
    })
  })

  describe('updateQuestion', () => {
    it('should update question if user is author', async () => {
      const question = await Question.create({
        title: 'Old title',
        text: 'Text',
        answers: validAnswers,
        type: 'oneAnswer',
        category: category._id,
        author: authorId
      })

      const updated = await questionService.updateQuestion(question._id, authorId.toString(), { title: 'New title' })

      expect(updated.title).toBe('New title')
      expect(updated.category).toHaveProperty('name', 'Science')
    })

    it('should throw forbidden error if user is not author', async () => {
      const question = await Question.create({
        title: 'Locked',
        text: 'Text',
        answers: validAnswers,
        type: 'oneAnswer',
        category: category._id,
        author: authorId
      })

      await expect(
        questionService.updateQuestion(question._id, anotherUserId.toString(), { title: 'Hack' })
      ).rejects.toThrow()
    })
  })
})
