const mongoose = require('mongoose')
mongoose.promise = require('bluebird')

const {DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME} = Object.assign({
  DATABASE_USER: 'admin',
  DATABASE_PASSWORD: 'admin',
  DATABASE_NAME: 'music'
}, process.env)

const DB_URL = `mongodb://${DATABASE_USER}:${DATABASE_PASSWORD}@localhost/${DATABASE_NAME}`

const connect = async () => {
  console.info('Connecting to database')
  await mongoose.connect(DB_URL, {useMongoClient: true})
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
