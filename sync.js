#!/usr/bin/env node

const synchronize = require('./lib/synchronize')
const storage = require('./lib/storage')

;(async () => {
  await storage.connect()
  await synchronize()
  await storage.disconnect()
})().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
