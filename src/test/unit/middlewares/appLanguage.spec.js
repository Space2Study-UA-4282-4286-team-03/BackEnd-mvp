jest.mock('~/consts/errors', () => ({
  enums: {
    INVALID_LANGUAGE: 'Invalid language'
  }
}))
jest.mock('~/utils/errorsHelper', () => ({
  createError: jest.fn((status, errorInfo) => new Error(errorInfo))
}))
jest.mock('~/consts/validation', () => ({
  enums: {
    APP_LANG_ENUM: ['en', 'ua']
  }
}))

const langMiddleware = require('~/middlewares/appLanguage')
const { createError } = require('~/utils/errorsHelper')
const { INVALID_LANGUAGE } = require('~/consts/errors')
describe('appLanguage middleware', () => {
  let req
  let res
  let next
  beforeEach(() => {
    req = {
      acceptsLanguages: jest.fn()
    }
    res = {}
    next = jest.fn()
    jest.clearAllMocks()
  })
  test('should set req.lang and call next() if a valid language is provided', () => {
    req.acceptsLanguages.mockReturnValue('en')
    langMiddleware(req, res, next)
    expect(req.lang).toBe('en')
    expect(next).toHaveBeenCalledTimes(1)
  })
  test('should throw an error if an invalid language is provided', () => {
    const invalidLangError = new Error(INVALID_LANGUAGE)
    req.acceptsLanguages.mockReturnValue(null | false)
    createError.mockReturnValue(invalidLangError)
    expect(() => langMiddleware(req, res, next)).toThrow(invalidLangError)
    expect(createError).toHaveBeenCalledWith(400, INVALID_LANGUAGE)
    expect(next).not.toHaveBeenCalled()
    expect(req.lang).toBeUndefined()
  })
  test('should throw an error if acceptsLanguages returns undefined', () => {
    const invalidLangError = new Error(INVALID_LANGUAGE)
    req.acceptsLanguages.mockReturnValue(undefined)
    createError.mockReturnValue(invalidLangError)
    expect(() => langMiddleware(req, res, next)).toThrow(invalidLangError)
    expect(createError).toHaveBeenCalledWith(400, INVALID_LANGUAGE)
    expect(next).not.toHaveBeenCalled()
    expect(req.lang).toBeUndefined()
  })
})
