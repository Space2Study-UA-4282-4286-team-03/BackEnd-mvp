const { createClient } = require('redis')

let redisClient = null
let isConnected = false

function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: 'redis://localhost:6379' })

    redisClient.on('error', (err) => {
      console.warn('Redis error', err.message)
      isConnected = false
    })

    redisClient
      .connect()
      .then(() => {
        console.log('Redis connected')
        isConnected = true
      })
      .catch((err) => {
        console.warn('Redis connection failed, continuing without cache:', err.message)
        isConnected = false
      })
  }

  return isConnected ? redisClient : null
}

module.exports = getRedisClient
