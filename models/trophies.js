const mongoose = require("mongoose");

const trophySchema = mongoose.Schema({
  name: String,
  number: Number,
});

const trophyModel = mongoose.model("trophies", trophySchema);

module.exports = trophyModel;
