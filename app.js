#!/usr/bin/env node

const express = require('express')
const morgan = require('morgan')
const through = require('through2')
const serializeError = require('serialize-error')
const yaml = require('js-yaml')
const synchronize = require('./lib/synchronize')
const storage = require('./lib/storage')

const PORT = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080
const IP = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
const FEED_URI = '/feed.json'
const MAX_ITEMS = 20
const SYNCHRONIZATION_INTERVAL = 10 * 60 * 1000

const app = express()
app.use(morgan('combined'))

const toArtistCredit = (releaseData) =>
  releaseData['artist-credit'].map(({artist: {name}}) => name).join(', ')

const toJsonFeed = (releases, host) => ({
  version: 'https://jsonfeed.org/version/1',
  title: 'New Releases',
  feed_url: `https://${host}${FEED_URI}`,
  home_page_url: 'https://tmdpw.eu/',
  items: releases.map((release) => ({
    id: release.reid,
    // TODO Move to storage
    date_published: new Date(release.created).toISOString(),
    title: toArtistCredit(release.data) + ' – ' + release.data.title,
    external_url: `https://musicbrainz.org/release/${release.reid}`,
    content_html: '<pre>' +
      yaml.safeDump(release.data).replace(/</g, '&lt;') +
      '</pre>'
  }))
})

app.get(FEED_URI, (req, res) => {
  const releases = []
  storage.findReleases(MAX_ITEMS)
    .pipe(through.obj((release, enc, cb) => {
      releases.push(release)
      cb()
    }, () => {
      res.send(toJsonFeed(releases, req.headers.host))
    }))
    .once('error', (error) => {
      res.status(500).send(serializeError(error))
    })
})

const server = app.listen(PORT, IP, () => {
  console.info('Listening on %s', JSON.stringify(server.address()))
  setInterval(synchronize, SYNCHRONIZATION_INTERVAL)
})
