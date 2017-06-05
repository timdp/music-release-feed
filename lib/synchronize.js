const pipe = require('multipipe')
const streamToPromise = require('stream-to-promise')
const client = require('./client')
const storage = require('./storage')
const {AsyncTransform, AsyncWritable} = require('./async-stream')

class ArtistToReleasesTransform extends AsyncTransform {
  constructor () {
    super({objectMode: true})
  }

  async _transformAsync (artist) {
    const releases = await client.findReleasesByArtistId(artist.arid)
    console.info('Found %d release(s) for %s', releases.length, artist.artist)
    return {
      artist,
      releases
    }
  }
}

class ReleaseWriter extends AsyncWritable {
  constructor () {
    super({objectMode: true})
  }

  async _writeAsync ({artist, releases}) {
    for (const release of releases) {
      const reid = release.id
      const arid = artist.arid
      const data = release
      await storage.addReleaseIfNotExists(reid, arid, data)
    }
  }
}

const addReleases = async () => {
  await streamToPromise(pipe(
    storage.findArtists(),
    new ArtistToReleasesTransform(),
    new ReleaseWriter()
  ))
}

module.exports = addReleases
