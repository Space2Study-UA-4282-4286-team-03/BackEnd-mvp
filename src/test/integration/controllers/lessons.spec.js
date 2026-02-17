const mongoose = require('mongoose')
const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const { expectError } = require('~/test/helpers')
const { UNAUTHORIZED, FORBIDDEN } = require('~/consts/errors')
const testUserAuthentication = require('~/utils/testUserAuth')
const TokenService = require('~/services/token')
const Lesson = require('~/models/lessons')
const Category = require('~/models/resourcesCategory')
const {
  roles: { TUTOR }
} = require('~/consts/auth')
// const categoryNamesAggregateOptions = require('~/src/utils/categories/categoryNamesAggregateOptions')

const endpointUrl = '/lessons/'

const studentUserData = {
  role: 'student',
  firstName: 'Yamada',
  lastName: 'Kizen',
  email: 'studentlessons@gmail.com',
  password: 'ninpopass',
  appLanguage: 'en',
  isEmailConfirmed: true,
  lastLogin: new Date().toJSON(),
  lastLoginAs: 'student'
}

describe('Lessons controller', () => {
  let app, server, accessToken, currentUser, studentAccessToken

  beforeAll(async () => {
    ;({ app, server } = await serverInit())
  })

  afterAll(async () => {
    await stopServer(server)
  })

  beforeEach(async () => {
    accessToken = await testUserAuthentication(app, { role: TUTOR })
    studentAccessToken = await testUserAuthentication(app, studentUserData)
    currentUser = TokenService.validateAccessToken(accessToken)
  })

  afterEach(async () => {
    await serverCleanup()
  })

  describe(`GET ${endpointUrl}`, () => {
    it('should return lessons for the authenticated tutor', async () => {
      const category = await Category.create({
        name: 'Science',
        author: currentUser.id
      })

      await Lesson.create([
        { title: 'Lesson A', files: [], category: category._id, author: currentUser.id },
        { title: 'Lesson B', files: [], category: category._id, author: currentUser.id }
      ])

      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.items).toHaveLength(2)
      expect(response.body.count).toBe(2)
      expect(response.body.items[0]).toHaveProperty('title')
      expect(response.body.items[0].category).toHaveProperty('name', 'Science')
    })

    it('should return empty list when tutor has no lessons', async () => {
      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.items).toHaveLength(0)
      expect(response.body.count).toBe(0)
    })

    it('should support pagination with skip and limit', async () => {
      const category = await Category.create({
        name: 'Math',
        author: currentUser.id
      })

      await Lesson.create([
        { title: 'Lesson 1', files: [], category: category._id, author: currentUser.id },
        { title: 'Lesson 2', files: [], category: category._id, author: currentUser.id },
        { title: 'Lesson 3', files: [], category: category._id, author: currentUser.id }
      ])

      const response = await app
        .get(endpointUrl)
        .query({ skip: 0, limit: 2 })
        .set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.items).toHaveLength(2)
      expect(response.body.count).toBe(3)
    })

    it('should throw UNAUTHORIZED when no token is provided', async () => {
      const response = await app.get(endpointUrl)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw FORBIDDEN when user is not a tutor', async () => {
      const response = await app.get(endpointUrl).set('Cookie', [`accessToken=${studentAccessToken}`])

      expectError(403, FORBIDDEN, response)
    })
  })

  describe(`GET ${endpointUrl}:id`, () => {
    it('should return a lesson by id', async () => {
      const category = await Category.create({
        name: 'Physics',
        author: currentUser.id
      })

      const lesson = await Lesson.create({
        title: 'Quantum Mechanics',
        files: ['notes.pdf'],
        category: category._id,
        author: currentUser.id
      })

      const response = await app.get(endpointUrl + lesson._id).set('Cookie', [`accessToken=${accessToken}`])

      expect(response.statusCode).toBe(200)
      expect(response.body.title).toBe('Quantum Mechanics')
      expect(response.body.files).toEqual(['notes.pdf'])
      expect(response.body.category).toHaveProperty('name', 'Physics')
    })

    it('should throw UNAUTHORIZED when no token is provided', async () => {
      const lessonId = new mongoose.Types.ObjectId()
      const response = await app.get(endpointUrl + lessonId)

      expectError(401, UNAUTHORIZED, response)
    })

    it('should throw FORBIDDEN when user is not a tutor', async () => {
      const lessonId = new mongoose.Types.ObjectId()
      const response = await app.get(endpointUrl + lessonId).set('Cookie', [`accessToken=${studentAccessToken}`])

      expectError(403, FORBIDDEN, response)
    })
  })

  describe(`POST ${endpointUrl}`, () => {
    it('Should create a lesson and return 201', async () => {
      const category = await Category.create({
        name: 'Science',
        author: currentUser.id
      })
      const lessonData = {
        title: 'new lesson',
        files: ['file1.pdf'],
        category: category._id.toString()
      }
      const response = await app
        .post(endpointUrl)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send(lessonData)

      expect(response.statusCode).toBe(201)
      expect(response.body).toHaveProperty('_id')
      expect(response.body.title).toBe('new lesson')
      expect(response.body.files).toEqual(['file1.pdf'])
      expect(response.body.category).toHaveProperty('name', 'Science')
      expect(response.body.author.toString()).toBe(currentUser.id)
    })

    it('Should create a lesson with only title (minimal data)', async () => {
      const response = await app
        .post(endpointUrl)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ title: 'Minimal lesson' })

      expect(response.statusCode).toBe(201)
      expect(response.body.title).toBe('Minimal lesson')
      expect(response.body.files).toEqual([])
      expect(response.body.category).toBeNull()
    })

    it('Should return 422 when title is missing', async () => {
      const response = await app
        .post(endpointUrl)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ files: ['file1.pdf'] })

      expect(response.statusCode).toBe(422)
      expect(response.body.code).toBe('FIELD_IS_NOT_DEFINED')
    })

    it('Should return 422 when title exceeds max length', async () => {
      const response = await app
        .post(endpointUrl)
        .set('Cookie', [`accessToken=${accessToken}`])
        .send({ title: 'A'.repeat(51) })

      expect(response.statusCode).toBe(422)
      expect(response.body.code).toBe('FIELD_IS_NOT_OF_PROPER_LENGTH')
    })

    it('Should throw UNAUTHORIZED when no token is provided', async () => {
      const response = await app.post(endpointUrl).send({ title: 'test' })

      expectError(401, UNAUTHORIZED, response)
    })

    it('Should throw FORBIDDEN when user is not a tutor', async () => {
      const response = await app
        .post(endpointUrl)
        .set('Cookie', [`accessToken=${studentAccessToken}`])
        .send({ title: 'test' })

      expectError(403, FORBIDDEN, response)
    })
  })
})
