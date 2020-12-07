const mongoose = require('mongoose')

const trophySchema = mongoose.Schema({
    name: String,
    image: String,
})

const trophyModel = mongoose.model('trophy', trophySchema)

module.exports = trophyModel