const mongoose = require("mongoose");

const chatSchema = mongoose.Schema({
  messages: Array, //liste des messages liés au user
});

const userSchema = mongoose.Schema({
  username: String, //nom ou pseudo du user
  password: String, //mot de passe du user
  salt: String, //salt pour le chiffrage du mot de passe
  secret_question: String, //question secrete pour la récupération du mot de passe
  secret_question_answer: String, //reponse a la question secrete pour la recupération du mot de passe
  job: String, //métier du user demande au début de l'entretien
  salary: Number, //pretentions salariales du user demandées au debut de l'entretien
  county: String, //region du user demandée au debut de l'entretien
  trophiesId: [{ type: mongoose.Schema.Types.ObjectId, ref: "trophies" }], //liste des trophées gagnés par le user
  package: { type: mongoose.Schema.Types.ObjectId, ref: "packages" }, //formule choisie par le user
  icopsId: [{ type: mongoose.Schema.Types.ObjectId, ref: "icops" }], //liste des icops détenus par le user
  chat_messages: [chatSchema], //historique des chats du user
  scores: Array, //historique des scores
});

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
