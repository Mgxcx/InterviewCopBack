const mongoose = require("mongoose");

const packageSchema = mongoose.Schema({
  name: String, //nom de la formule (Free, Plus ou Pro)
  price: Number, //tarif de la formule
  advanced_reports: Boolean, //accès aux rapports apprfondis (oui ou non)
  personal_coach: Boolean, //accès au coach personnel (oui ou non)
});

const packageModel = mongoose.model("packages", packageSchema);

module.exports = packageModel;
