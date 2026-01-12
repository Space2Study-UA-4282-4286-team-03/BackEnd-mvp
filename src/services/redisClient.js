const { createClient } = require('redis')
const logger = require('~/logger/logger')

let redisClient = null
let isConnected = false
let isRedisAvailable = true
let retryTimeout = null

function tryReconnect() {
  if (isConnected) return

  logger.info('Retrying Redis connection...')
  redisClient = null
  getRedisClient()
}

function scheduleRetry() {
  if (retryTimeout || isConnected) return
  retryTimeout = setTimeout(() => {
    retryTimeout = null
    tryReconnect()
  }, 60000)
}

async function getRedisClient() {
  if (!isRedisAvailable) {
    scheduleRetry()
    return null
  }

  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: { reconnectStrategy: false }
    })

    redisClient.on('error', (err) => {
      logger.warn('Redis error', err.message)
      isConnected = false
      isRedisAvailable = false
      scheduleRetry()
    })

    redisClient
      .connect()
      .then(() => {
        logger.info('Redis connected')
        isConnected = true
        isRedisAvailable = true

        if (retryTimeout) {
          clearTimeout(retryTimeout)
          retryTimeout = null
        }
      })
      .catch((err) => {
        logger.warn('Redis connection failed, continuing without cache:', err.message)
        isConnected = false
        isRedisAvailable = false
        scheduleRetry()
      })
  }

  await isConnected
  return redisClient?.isReady ? redisClient : null
}

module.exports = getRedisClient
