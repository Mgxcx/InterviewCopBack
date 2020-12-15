const mongoose = require("mongoose");

const adviceSchema = mongoose.Schema({
  title: String,
  content: String,
  category: String,
});

const adviceModel = mongoose.model("advices", adviceSchema);

module.exports = adviceModel;
