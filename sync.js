#!/usr/bin/env node

const synchronize = require('./lib/synchronize')
const storage = require('./lib/storage')

;(async () => {
  await synchronize()
  await storage.dispose()
})().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
