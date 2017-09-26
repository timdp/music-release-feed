#!/usr/bin/env node

const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const serializeError = require('serialize-error')
const yaml = require('js-yaml')
const synchronize = require('./lib/synchronize')
const storage = require('./lib/storage')
const {Artist, Release} = require('./lib/models')

const PORT = 8080
const MAX_ITEMS = 20
const SYNCHRONIZATION_INTERVAL = 10 * 60 * 1000

const HOME_PAGE_URL = 'https://tmdpw.eu/'
const FEED_URI = '/feed.json'

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())

class HttpError extends Error {
  constructor (status) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

const toArtistCredit = (releaseData) =>
  releaseData['artist-credit'].map(({artist: {name}}) => name).join(', ')

const toJsonFeed = (releases, feedUrl) => ({
  version: 'https://jsonfeed.org/version/1',
  title: 'New Releases',
  feed_url: feedUrl,
  home_page_url: HOME_PAGE_URL,
  items: releases.map((release) => ({
    id: release.reid,
    date_published: release.date.toISOString(),
    title: toArtistCredit(release.data) + ' – ' + release.data.title,
    external_url: `https://musicbrainz.org/release/${release.reid}`,
    content_html: '<pre>' +
      yaml.safeDump(release.data).replace(/</g, '&lt;') +
      '</pre>'
  }))
})

const handle = (fn) => (req, res) => {
  fn(req, res)
    .then((out) => res.send(out || {}))
    .catch((err) => {
      const status = (err instanceof HttpError) ? err.status : 500
      res.status(status).send(serializeError(err))
    })
}

app.get('/', (req, res) => {
  res.redirect(HOME_PAGE_URL)
})

app.get('/health', (req, res) => {
  res.send({})
})

app.get(FEED_URI, handle(async (req, res) => {
  const releases = await Release.find().sort('-date').limit(MAX_ITEMS).exec()
  return toJsonFeed(releases, `${req.protocol}://${req.headers.host}${FEED_URI}`)
}))

app.get('/artists', handle(async (req, res) => {
  const artists = await Artist.find().exec()
  return {artists}
}))

app.get('/artists/:id', handle(async (req, res) => {
  const arid = req.params.id
  const artist = await Artist.findOne({arid})
  if (artist == null) {
    throw new HttpError(404)
  }
  return artist
}))

app.put('/artists/:id', handle(async (req, res) => {
  const arid = req.params.id
  const name = req.body.name
  await Artist.findOneAndUpdate({arid}, {arid, name}, {upsert: true}).exec()
}))

app.delete('/artists/:id', handle(async (req, res) => {
  const arid = req.params.id
  await Artist.deleteOne({arid})
}))

;(async () => {
  await storage.connect()
  const server = app.listen(PORT, () => {
    console.info('Listening on %s', JSON.stringify(server.address()))
    synchronize()
    setInterval(synchronize, SYNCHRONIZATION_INTERVAL)
  })
})()
