const { serverInit, serverCleanup, stopServer } = require('~/test/setup')
const tokenService = require('~/services/token')
const { getUserByEmail } = require('~/services/user')
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
      const res = await app.post('/auth/signup').send({
        role: 'student',
        firstName: 'Ivan',
        lastName: 'Petrenko',
        email: 'ivan@test.com',
        password: '123456Abc',
        language: 'ua'
      })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('userId')

      const user = await getUserByEmail('ivan@test.com')
      expect(user).toBeTruthy()
      expect(user.isEmailConfirmed).toBe(false)
    })
  })

  describe('POST /auth/login', () => {
    it('should not allow login if email not confirmed', async () => {
      await app.post('/auth/signup').send({
        role: 'student',
        firstName: 'Ivan',
        lastName: 'Petrenko',
        email: 'login@test.com',
        password: '123456Abc',
        language: 'ua'
      })

      const res = await app.post('/auth/login').send({
        email: 'login@test.com',
        password: '123456Abc'
      })
      expect(res.status).toBe(401)
    })

    it('should login confirmed user and return tokens', async () => {
      await app.post('/auth/signup').send({
        role: 'student',
        firstName: 'Ivan',
        lastName: 'Petrenko',
        email: 'confirmed@test.com',
        password: '123456Abc',
        language: 'ua'
      })

      const User = mongoose.model('User')
      const user = await User.findOne({ email: 'confirmed@test.com' })
      expect(user).toBeTruthy()
      user.isEmailConfirmed = true
      await user.save()
      expect(user.email).toBe('confirmed@test.com')

      const res = await app.post('/auth/login').send({
        email: 'confirmed@test.com',
        password: '123456Abc'
      })

      expect(res.body.error).toBeUndefined()
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
    })
  })

  describe('POST /auth/refresh', () => {
    it('should issue new access token with valid refresh token', async () => {
      await app.post('/auth/signup').send({
        role: 'student',
        firstName: 'Ivan',
        lastName: 'Petrenko',
        email: 'refresh@test.com',
        password: '123456Abc',
        language: 'ua'
      })

      const User = mongoose.model('User')
      const user = await User.findOne({ email: 'refresh@test.com' })
      expect(user).toBeTruthy()
      user.isEmailConfirmed = true
      await user.save()
      expect(user.email).toBe('refresh@test.com')

      const loginRes = await app.post('/auth/login').send({
        email: 'refresh@test.com',
        password: '123456Abc'
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
      await app.post('/auth/signup').send({
        role: 'student',
        firstName: 'Ivan',
        lastName: 'Petrenko',
        email: 'logout@test.com',
        password: '123456Abc',
        language: 'ua'
      })

      const user = await mongoose
        .model('User')
        .findOneAndUpdate({ email: 'logout@test.com' }, { isEmailConfirmed: true }, { new: true })
      user.isEmailConfirmed = true
      await user.save()

      const loginRes = await app.post('/auth/login').send({
        email: 'logout@test.com',
        password: '123456Abc'
      })

      const res = await app.post('/auth/logout').send({
        refreshToken: loginRes.body.refreshToken
      })

      expect(res.status).toBe(204)
    })
  })

  describe('Email confirmation', () => {
    it('should confirm email using confirm token', async () => {
      await app.post('/auth/signup').send({
        role: 'student',
        firstName: 'Ivan',
        lastName: 'Petrenko',
        email: 'confirm@test.com',
        password: '123456Abc',
        language: 'ua'
      })

      const user = await getUserByEmail('confirm@test.com')
      const tokenDoc = await tokenService.getUserToken(user._id, CONFIRM_TOKEN)
      expect(tokenDoc).toBeTruthy()
      expect(tokenDoc.confirmToken).toBeDefined()
      const res = await app.get(`/auth/confirm-email/${tokenDoc.confirmToken}`)
      expect(res.status).toBe(200)
      const updatedUser = await getUserByEmail('confirm@test.com')
      expect(updatedUser.isEmailConfirmed).toBe(true)
    })
  })
})
