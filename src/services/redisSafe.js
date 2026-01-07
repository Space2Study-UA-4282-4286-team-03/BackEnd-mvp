const getRedisClient = require('./redisClient')

async function safeGet(key) {
  const client = getRedisClient()
  if (!client) return null
  try {
    return await client.get(key)
  } catch (e) {
    console.warn(`Redis GET failed for key ${key}`, e.message)
    return null
  }
}

async function safeSetEx(key, ttl, value) {
  const client = getRedisClient()
  if (!client) return
  try {
    await client.setEx(key, ttl, value)
  } catch (e) {
    console.warn(`Redis SET failed for key ${key}`, e.message)
  }
}

module.exports = { safeGet, safeSetEx }
