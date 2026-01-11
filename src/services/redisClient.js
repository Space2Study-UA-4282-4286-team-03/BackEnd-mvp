const { createClient } = require('redis')

let clientPromise = null

function getRedisClient() {
  if (!clientPromise) {
    const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })

    client.on('error', (err) => {
      console.warn('Redis error', err.message)
    })

    clientPromise = client
      .connect()
      .then(() => {
        console.log('Redis connected')
        return client
      })
      .catch((err) => {
        console.warn('Redis connection failed, continuing without cache:', err.message)
        return null
      })
  }
  return clientPromise
}

module.exports = getRedisClient
