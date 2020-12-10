const mongoose = require("mongoose");

const trophySchema = mongoose.Schema({
  name: String,
  image: String,
});

const trophyModel = mongoose.model("trophies", trophySchema);

module.exports = trophyModel;
