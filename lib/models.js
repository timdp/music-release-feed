const {mongoose} = require('./storage')
const {Schema} = mongoose

const Artist = mongoose.model('Artist', new Schema({
  arid: String,
  name: String
}))

const Release = mongoose.model('Release', new Schema({
  reid: String,
  data: Schema.Types.Mixed,
  date: {
    type: Date,
    default: Date.now
  }
}))

module.exports = {
  Artist,
  Release
}
