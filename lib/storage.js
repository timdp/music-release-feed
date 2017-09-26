const mongoose = require('mongoose')
const retry = require('async-retry')

mongoose.promise = require('bluebird')

const {MONGODB_USER, MONGODB_PASSWORD, MONGODB_SERVICE_HOST, MONGODB_SERVICE_PORT, MONGODB_DATABASE} = Object.assign({
  MONGODB_USER: 'admin',
  MONGODB_PASSWORD: 'admin',
  MONGODB_SERVICE_HOST: '127.0.0.1',
  MONGODB_SERVICE_PORT: '27017',
  MONGODB_DATABASE: 'music'
}, process.env)

const DB_URL = `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_SERVICE_HOST}:${MONGODB_SERVICE_PORT}/${MONGODB_DATABASE}`

const connect = async () => {
  console.info('Connecting to database')
  await retry(async () => {
    await mongoose.connect(DB_URL, {useMongoClient: true})
  }, {
    onRetry (err) {
      console.warn(`Retrying failed connection: ${err}`)
    }
  })
  console.info('Connected to database')
}

const disconnect = async () => {
  console.info('Disconnecting from database')
  await mongoose.disconnect()
  console.info('Disconnected from database')
}

module.exports = {
  mongoose,
  connect,
  disconnect
}
