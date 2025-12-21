const validationMiddleware = require('~/middlewares/validation')

jest.mock('~/utils/errorsHelper', () => ({
  createError: jest.fn((status, message) => {
    const err = new Error(message)
    err.status = status
    return err
  })
}))

jest.mock('~/utils/validationHelper', () => ({
  validateRequired: jest.fn(),
  validateFunc: {
    minLength: jest.fn(),
    required: jest.fn(),
    isEmail: jest.fn()
  }
}))

jest.mock('~/consts/errors', () => ({
  BODY_IS_NOT_DEFINED: 'BODY_IS_NOT_DEFINED'
}))

const { createError } = require('~/utils/errorsHelper')
const { validateRequired, validateFunc } = require('~/utils/validationHelper')
const { BODY_IS_NOT_DEFINED } = require('~/consts/errors')

describe('validationMiddleware', () => {
  let req
  let next

  beforeEach(() => {
    req = {}
    next = jest.fn()
    jest.clearAllMocks()
  })

  it('throws error if body is not defined', () => {
    const middleware = validationMiddleware({})

    expect(() => middleware(req, {}, next)).toThrow(BODY_IS_NOT_DEFINED)
    expect(createError).toHaveBeenCalledWith(422, BODY_IS_NOT_DEFINED)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls validateRequired for required fields', () => {
    req.body = { name: 'John' }

    const schema = {
      name: { required: true }
    }

    const middleware = validationMiddleware(schema)
    middleware(req, {}, next)

    expect(validateRequired).toHaveBeenCalledWith('name', true, 'John')
    expect(next).toHaveBeenCalled()
  })

  it('calls validation functions when field exists', () => {
    req.body = { email: 'test@test.com' }

    const schema = {
      email: {
        required: true,
        isEmail: true,
        minLength: 5
      }
    }

    const middleware = validationMiddleware(schema)
    middleware(req, {}, next)

    expect(validateFunc.isEmail).toHaveBeenCalledWith('email', true, 'test@test.com')

    expect(validateFunc.minLength).toHaveBeenCalledWith('email', 5, 'test@test.com')

    expect(next).toHaveBeenCalled()
  })

  it('does not call validation funcs if field is missing', () => {
    req.body = {}

    const schema = {
      email: {
        required: false,
        isEmail: true
      }
    }

    const middleware = validationMiddleware(schema)
    middleware(req, {}, next)

    expect(validateFunc.isEmail).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
