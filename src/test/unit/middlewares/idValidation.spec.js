jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn()
    }
  }
}))

const mongoose = require('mongoose')
const { INVALID_ID } = require('~/consts/errors')
const { createError } = require('~/utils/errorsHelper')
const idValidation = require('~/middlewares/idValidation')

describe('idValidation middleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = {}
    res = {}
    next = jest.fn()
    jest.clearAllMocks()
  })

  test('should call next() if a valid ID is provided', () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(true)
    const validId = '60d5ec49f1d2c12a34567890'
    idValidation(req, res, next, validId)
    expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(validId)
    expect(next).toHaveBeenCalledTimes(1)
  })
  test('throws error when id is invalid', () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false)

    expect(() => {
      idValidation(req, res, next, 'invalid-id')
    }).toThrow(createError(400, INVALID_ID))

    expect(next).not.toHaveBeenCalled()
  })
})
