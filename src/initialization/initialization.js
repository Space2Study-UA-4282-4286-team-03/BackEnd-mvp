const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express')
const path = require('path')

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const {
  config: { CLIENT_URL }
} = require('~/configs/config')
const router = require('~/routes')
const { createNotFoundError } = require('~/utils/errorsHelper')
const errorMiddleware = require('~/middlewares/error')

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API for space2study',
      version: '',
      description: ''
    },
    servers: [
      {
        url: `http://localhost:${process.env.SERVER_PORT || 3000}`
      }
    ]
  },
  apis: [path.join(process.cwd(), 'docs/**/*.yaml')]
}
const swaggerSettings = swaggerJsDoc(swaggerOptions)

const initialization = (app) => {
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(
    cors({
      origin: process.env.NODE_ENV === 'development' ? true : CLIENT_URL,
      credentials: true,
      methods: 'GET, POST, PATCH, DELETE',
      allowedHeaders: 'Content-Type, Authorization'
    })
  )
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSettings))
  app.use('/', router)

  app.use((_req, _res, next) => {
    next(createNotFoundError())
  })

  app.use(errorMiddleware)
}

module.exports = initialization
