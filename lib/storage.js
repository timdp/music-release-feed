const Promise = require('bluebird')
const sqlite3 = require('sqlite3')
const path = require('path')
const {Readable} = require('stream')

const DB_PATH = path.resolve(__dirname, '../data.sqlite')

class RowStream extends Readable {
  constructor (db, sql, params = []) {
    super({objectMode: true})
    this._db = db
    this._sql = sql
    this._params = params
    this._reading = false
  }

  _read () {
    if (this._reading) {
      return
    }
    this._reading = true
    this._db.each(this._sql, ...this._params, (err, row) => {
      if (err != null) {
        this.emit('error', err)
      } else {
        row.data = JSON.parse(row.data)
        this.push(row)
      }
    }, () => {
      this.push(null)
    })
  }
}

class Storage {
  constructor () {
    this._db = new sqlite3.Database(DB_PATH)
    Promise.promisifyAll(this._db)
  }

  findArtists () {
    return new RowStream(this._db,
      'SELECT * FROM artists')
  }

  async addReleaseIfNotExists (reid, arid, data) {
    await this._db.runAsync(
      `INSERT INTO releases (reid, arid, data)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM releases WHERE reid = ?)`,
      reid, arid, JSON.stringify(data), reid)
  }

  findReleases (max) {
    return new RowStream(this._db,
      `SELECT re.reid, re.arid, ar.artist, re.data, re.created
        FROM releases re JOIN artists ar ON re.arid = ar.arid
        ORDER BY re.modified desc, re.created desc
        LIMIT ?`,
      [max])
  }

  async dispose () {
    await this._db.closeAsync()
  }
}

module.exports = new Storage()
