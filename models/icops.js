const mongoose = require("mongoose");

const icopSchema = mongoose.Schema({
  name: String,
  number: String,
});

const icopModel = mongoose.model("icops", icopSchema);

module.exports = icopModel;
