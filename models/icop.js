const mongoose = require('mongoose')

const icopSchema = mongoose.Schema({
    name: String,
    image: String
})

const icopModel = mongoose.model('icop', icopSchema)

module.exports = icopModel