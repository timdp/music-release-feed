const pipe = require('multipipe')
const streamToPromise = require('stream-to-promise')
const client = require('./client')
const {Artist, Release} = require('./models')
const {AsyncTransform, AsyncWritable} = require('./async-stream')

class ArtistToReleasesTransform extends AsyncTransform {
  constructor () {
    super({objectMode: true})
  }

  async _transformAsync (artist) {
    const releases = await client.findReleasesByArtistId(artist.arid)
    console.info('Found %d release(s) for %s', releases.length, artist.name)
    return {artist, releases}
  }
}

class ReleaseWriter extends AsyncWritable {
  constructor () {
    super({objectMode: true})
  }

  async _writeAsync ({artist, releases}) {
    for (const release of releases) {
      const reid = release.id
      const data = release
      await Release.findOneAndUpdate({reid}, {reid, data}, {upsert: true}).exec()
    }
  }
}

const addReleases = async () => {
  await streamToPromise(pipe(
    Artist.find().cursor(),
    new ArtistToReleasesTransform(),
    new ReleaseWriter()
  ))
}

module.exports = addReleases
