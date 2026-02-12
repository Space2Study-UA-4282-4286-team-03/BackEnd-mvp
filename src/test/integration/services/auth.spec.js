const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const tokenService = require('~/services/token')
const { getUserByEmail } = require('~/services/user')
require('dotenv').config({
  path: '.env.test.local'
})

const mongoose = require('mongoose')
const {
  tokenNames: { CONFIRM_TOKEN }
} = require('~/consts/auth')

jest.mock('~/services/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}))

describe('Auth API (integration)', () => {
  let app
  let server

  const testUser = {
    role: 'student',
    firstName: 'Ivan',
    lastName: 'Petrenko',
    email: 'ivan@test.com',
    password: process.env.TEST_USER_PASSWORD,
    language: 'ua'
  }

  beforeAll(async () => {
    const res = await serverInit()
    app = res.app
    server = res.server
  })

  afterEach(async () => {
    await serverCleanup()
  })

  afterAll(async () => {
    await stopServer(server)
  })

  describe('POST /auth/signup', () => {
    it('should create user and send confirmation email', async () => {
      const res = await app.post('/auth/signup').send(testUser)

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('userId')

      const user = await getUserByEmail(testUser.email)
      expect(user).toBeTruthy()
      expect(user.isEmailConfirmed).toBe(false)
    })
  })

  describe('POST /auth/login', () => {
    it('should not allow login if email not confirmed', async () => {
      await app.post('/auth/signup').send(testUser)

      const res = await app.post('/auth/login').send({
        email: testUser.email,
        password: process.env.TEST_USER_PASSWORD
      })
      expect(res.status).toBe(401)
    })

    it('should login confirmed user and return tokens', async () => {
      await app.post('/auth/signup').send(testUser)

      const User = mongoose.model('User')
      const user = await User.findOne({ email: testUser.email })
      expect(user).toBeTruthy()
      user.isEmailConfirmed = true
      await user.save()
      expect(user.email).toBe(testUser.email)

      const res = await app.post('/auth/login').send({
        email: testUser.email,
        password: process.env.TEST_USER_PASSWORD
      })

      expect(res.body.error).toBeUndefined()
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
    })
  })

  describe('GET /auth/refresh', () => {
    it('should issue new access token with valid refresh token', async () => {
      await app.post('/auth/signup').send(testUser)

      const User = mongoose.model('User')
      const user = await User.findOne({ email: testUser.email })
      expect(user).toBeTruthy()
      user.isEmailConfirmed = true
      await user.save()
      expect(user.email).toBe(testUser.email)

      const loginRes = await app.post('/auth/login').send({
        email: testUser.email,
        password: process.env.TEST_USER_PASSWORD
      })

      expect(loginRes.body.error).toBeUndefined()
      const refreshRes = await app.get('/auth/refresh').set('Cookie', loginRes.headers['set-cookie'])

      expect(refreshRes.body.error).toBeUndefined()
      expect(refreshRes.status).toBe(200)
      expect(refreshRes.body).toHaveProperty('accessToken')
    })
  })

  describe('POST /auth/logout', () => {
    it('should remove refresh token', async () => {
      await app.post('/auth/signup').send(testUser)

      const user = await mongoose
        .model('User')
        .findOneAndUpdate({ email: testUser.email }, { isEmailConfirmed: true }, { new: true })
      user.isEmailConfirmed = true
      await user.save()

      const loginRes = await app.post('/auth/login').send({
        email: testUser.email,
        password: process.env.TEST_USER_PASSWORD
      })

      const res = await app.post('/auth/logout').send({
        refreshToken: loginRes.body.refreshToken
      })

      expect(res.status).toBe(204)
    })
  })

  describe('Email confirmation', () => {
    it('should confirm email using confirm token', async () => {
      await app.post('/auth/signup').send(testUser)

      const user = await getUserByEmail(testUser.email)
      const tokenDoc = await tokenService.getUserToken(user._id, CONFIRM_TOKEN)
      expect(tokenDoc).toBeTruthy()
      expect(tokenDoc.confirmToken).toBeDefined()
      const res = await app.get(`/auth/confirm-email/${tokenDoc.confirmToken}`)
      expect(res.status).toBe(200)
      const updatedUser = await getUserByEmail(testUser.email)
      expect(updatedUser.isEmailConfirmed).toBe(true)
    })
  })
})
