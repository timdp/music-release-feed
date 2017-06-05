const NB = require('nodebrainz')
const retry = require('async-retry')
const Promise = require('bluebird')
const readPkgUp = require('read-pkg-up')

const {pkg} = readPkgUp.sync()
const userAgent = `${pkg.artistName}/${pkg.version} ( ${pkg.homepage} )`

class Client {
  constructor () {
    this._nb = new NB({userAgent})
    Promise.promisifyAll(this._nb)
  }

  async findArtistByName (artistName) {
    return this.findArtist({artist: artistName})
  }

  async findArtistById (artistId) {
    return this.findArtist({arid: artistId})
  }

  async findArtist (query) {
    const matches = this._search('artist', query, 'artists')
    if (matches.length === 0) {
      throw new Error('No results')
    }
    return matches[0]
  }

  async findReleasesByArtistId (artistId) {
    return this._search('release', {arid: artistId}, 'releases')
  }

  _search (type, query, key) {
    return retry(async (bail) => {
      let result, error
      try {
        result = await this._nb.searchAsync(type, query)
      } catch (err) {
        error = err
      }
      if (error != null) {
        if (error.message === 'Rate limited') {
          throw error
        } else {
          bail(error)
        }
      } else if (result[key] == null) {
        throw new Error('Invalid response')
      } else {
        return result[key]
      }
    })
  }
}

module.exports = new Client()
