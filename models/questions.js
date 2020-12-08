const mongoose = require("mongoose");

const answerSchema = mongoose.Schema({
  order: String, //order correspond à A,B,C ou D
  text: String, //text  correspond au contenu de la question
  points: Number, //points correspond au nombre de points générés par la résponse
});

const questionSchema = mongoose.Schema({
  question: String, //intitulé de la question
  answers: [answerSchema], //liste des réponses
  advice: String, //conseil
  linked_icop: { type: mongoose.Schema.Types.ObjectId, ref: "icop" }, //icop lié à la question
});

const questionModel = mongoose.model("questions", questionSchema);

module.exports = questionModel;
