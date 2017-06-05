const {Transform, Writable} = require('stream')

class AsyncTransform extends Transform {
  _transform (chunk, enc, cb) {
    this._transformAsync(chunk, enc).then((res) => cb(null, res), cb)
  }
}

class AsyncWritable extends Writable {
  _write (chunk, enc, cb) {
    this._writeAsync(chunk, enc).then((res) => cb(null, res), cb)
  }
}

module.exports = {
  AsyncTransform,
  AsyncWritable
}
