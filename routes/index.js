var express = require("express");
var router = express.Router();

var uid2 = require("uid2");
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");

var userModel = require("../models/users");

router.post("/sign-up", async function (req, res, next) {
  let error = [];
  let result = false;
  let saveUser = null;

  const data = await userModel.findOne({
    username: req.body.usernameFromFront,
  });

  if (data != null) {
    error.push("utilisateur déjà présent");
  }

  if (req.body.usernameFromFront == "" || req.body.passwordFromFront == "") {
    error.push("champs vides");
  }

  if (error.length == 0) {
    let salt = uid2(32);
    let newUser = new userModel({
      username: req.body.usernameFromFront,
      password: SHA256(req.body.passwordFromFront + salt).toString(encBase64),
      salt: salt,
      secret_question: req.body.secret_question,
      secret_question_answer: req.body.secret_question_answer,
    });

    saveUser = await newUser.save();

    if (saveUser) {
      result = true;
    }
  }

  res.json({ result, saveUser, error });
});

router.post("/sign-in", async function (req, res, next) {
  let result = false;
  let user = null;
  let error = [];

  if (req.body.usernameFromFront == "" || req.body.passwordFromFront == "") {
    error.push("champs vides");
  }

  if (error.length == 0) {
    const user = await userModel.findOne({
      username: req.body.usernameFromFront,
    });

    if (user) {
      const passwordEncrypt = SHA256(req.body.passwordFromFront + user.salt).toString(encBase64);

      if (passwordEncrypt == user.password) {
        result = true;
      } else {
        error.push("mot de passe incorrect");
      }
    } else {
      error.push("username incorrect");
    }
  }
  res.json({ result, user, error });
});

router.post("/password-recovery", async function (req, res, next) {
  let result = false;
  let user = null;
  let error = [];

  if (
    req.body.usernameFromFront == "" ||
    req.body.secret_questionFromFront == "" ||
    req.body.secret_question_answerFromFront == ""
  ) {
    error.push("champs vides");
  }

  if (error.length == 0) {
    const user = await userModel.findOne({
      username: req.body.usernameFromFront,
      secret_question: req.body.secret_questionFromFront,
      secret_question_answer: req.body.secret_question_answerFromFront,
    });

    if (user) {
      result = true;
    } else {
      error.push("champs incorrects");
    }
  }
  res.json({ result, user, error });
});

router.post("/new-password", async function (req, res, next) {
  let result = false;
  let user = null;
  let error = [];

  if (req.body.newPasswordFromFront == "") {
    error.push("champ vide");
  }

  if (error.length == 0) {
    const user = await userModel.findOne({ username: req.body.usernameFromFront });

    if (user) {
      await userModel.updateOne(
        { username: req.body.usernameFromFront },
        { password: SHA256(req.body.newPasswordFromFront + user.salt).toString(encBase64) }
      );
      result = true;
    } else {
      error.push("le nouveau mot de passe n'a pas été enregistré");
    }
  }

  res.json({ result, user, error });
});

module.exports = router;
