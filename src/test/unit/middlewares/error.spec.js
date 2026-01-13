const errorMiddleware = require('~/middlewares/error')

jest.mock('~/logger/logger', () => ({
  error: jest.fn()
}))

jest.mock('~/utils/getUniqueFields', () => jest.fn())

jest.mock('~/consts/errors', () => ({
  INTERNAL_SERVER_ERROR: { code: 'INTERNAL_SERVER_ERROR' },
  DOCUMENT_ALREADY_EXISTS: jest.fn((fields) => ({
    code: 'DOCUMENT_ALREADY_EXISTS',
    fields
  })),
  MONGO_SERVER_ERROR: jest.fn((message) => ({
    code: 'MONGO_SERVER_ERROR',
    message
  })),
  VALIDATION_ERROR: jest.fn((message) => ({
    code: 'VALIDATION_ERROR',
    message
  }))
}))

const logger = require('~/logger/logger')
const getUniqueFields = require('~/utils/getUniqueFields')
const {
  INTERNAL_SERVER_ERROR,
  DOCUMENT_ALREADY_EXISTS,
  MONGO_SERVER_ERROR,
  VALIDATION_ERROR
} = require('~/consts/errors')

describe('errorMiddleware', () => {
  let res

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    jest.clearAllMocks()
  })

  it('handles MongoServerError with duplicate key (11000)', () => {
    const err = {
      name: 'MongoServerError',
      code: 11000,
      message: 'duplicate key error'
    }

    getUniqueFields.mockReturnValue(['email'])

    errorMiddleware(err, {}, res, jest.fn())

    expect(getUniqueFields).toHaveBeenCalledWith(err.message)
    expect(DOCUMENT_ALREADY_EXISTS).toHaveBeenCalledWith(['email'])

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      status: 409,
      code: 'DOCUMENT_ALREADY_EXISTS',
      fields: ['email']
    })
  })

  it('handles MongoServerError with other mongo error', () => {
    const err = {
      name: 'MongoServerError',
      code: 123,
      message: 'mongo error'
    }

    errorMiddleware(err, {}, res, jest.fn())

    expect(MONGO_SERVER_ERROR).toHaveBeenCalledWith('mongo error')
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      status: 500,
      code: 'MONGO_SERVER_ERROR',
      message: 'mongo error'
    })
  })

  it('handles ValidationError', () => {
    const err = {
      name: 'ValidationError',
      message: 'invalid data'
    }

    errorMiddleware(err, {}, res, jest.fn())

    expect(VALIDATION_ERROR).toHaveBeenCalledWith('invalid data')
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      status: 409,
      code: 'VALIDATION_ERROR',
      message: 'invalid data'
    })
  })

  it('handles unknown error without status and code', () => {
    const err = {
      message: 'unexpected error'
    }

    errorMiddleware(err, {}, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      status: 500,
      code: INTERNAL_SERVER_ERROR.code,
      message: 'unexpected error'
    })
  })

  it('handles error with status and code', () => {
    const err = {
      status: 403,
      code: 'FORBIDDEN',
      message: 'access denied'
    }

    errorMiddleware(err, {}, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      status: 403,
      code: 'FORBIDDEN',
      message: 'access denied'
    })
  })

  it('logs error', () => {
    const err = { message: 'log me' }

    errorMiddleware(err, {}, res, jest.fn())

    expect(logger.error).toHaveBeenCalledWith(err)
  })
})
