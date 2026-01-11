const getRedisClient = require('./redisClient')
const logger = require('~/logger')

async function safeGet(key) {
  const client = getRedisClient()
  if (!client) return null
  try {
    return await client.get(key)
  } catch (e) {
    logger.warn('Redis GET operation failed', { key, error: e.message })
    return null
  }
}

async function safeSetEx(key, ttl, value) {
  const client = getRedisClient()
  if (!client) return
  try {
    await client.setEx(key, ttl, value)
  } catch (e) {
    logger.warn('Redis SET operation failed', { key, ttl, error: e.message })
  }
}

module.exports = { safeGet, safeSetEx }
