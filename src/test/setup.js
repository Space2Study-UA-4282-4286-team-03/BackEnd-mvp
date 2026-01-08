const express = require('express')
const mongoose = require('mongoose')
const request = require('supertest')
require('~/initialization/envSetup')

const serverSetup = require('~/initialization/serverSetup')

const serverInit = async () => {
  const app = express()
  const server = await serverSetup(app)
  return { app: request(app), server }
}

const serverCleanup = async () => {
  if (mongoose.connection.readyState !== 1) return
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase()
  }
}

const stopServer = async (server) => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close()
  }
  if (server?.close) {
    await server.close()
  }
}

module.exports = { serverInit, serverCleanup, stopServer }
