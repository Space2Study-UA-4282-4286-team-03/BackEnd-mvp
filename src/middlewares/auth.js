const { createUnauthorizedError, createForbiddenError } = require('~/utils/errorsHelper')
const { tokenValidation } = require('../utils/tokenValidation')

const authMiddleware = (req, _res, next) => {
  req.headers = req.headers || {}
  let accessToken = null

  if (req.cookies && req.cookies.accessToken) {
    accessToken = req.cookies.accessToken
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    accessToken = req.headers.authorization.split(' ')[1]
  }

  if (!accessToken) {
    return next(createUnauthorizedError())
  }

  const userData = tokenValidation(accessToken)
  req.user = userData

  next()
}

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createForbiddenError())
    }
    next()
  }
}

module.exports = { authMiddleware, restrictTo }
