var express = require("express");
var router = express.Router();

var uid2 = require("uid2");
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");

var userModel = require("../models/users");
var questionModel = require("../models/questions");
var trophyModel = require("../models/trophies");

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
    user = await userModel.findOne({
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
    user = await userModel.findOne({
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
    user = await userModel.findOne({ username: req.body.usernameFromFront });

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

router.post("/update-userdata", async function (req, res, next) {
  let result = false;
  let user = null;
  let updateUser = null;
  let error = [];

  if (
    req.body.jobFromFront == "" ||
    req.body.experienceFromFront == "" ||
    req.body.salaryFromFront == "" ||
    req.body.countyFromFront == ""
  ) {
    error.push("erreur: un ou plusieurs champs sont vides");
  }

  if (error.length == 0) {
    user = await userModel.findOne({ username: req.body.usernameFromFront });

    if (user) {
      updateUser = await userModel.updateOne(
        { username: req.body.usernameFromFront },
        {
          job: req.body.jobFromFront,
          experience: req.body.experienceFromFront,
          salary: req.body.salaryFromFront,
          county: req.body.countyFromFront,
        }
      );
      if (updateUser) {
        result = true;
        user = await userModel.findOne({ username: req.body.usernameFromFront }); //on refait une requête à la BDD pour envoyer au front le user mis à jour
      }
    } else {
      error.push("erreur: l'enregistrement des données a échoué");
    }
  }

  res.json({ result, error, user });
});

router.get("/generate-questions", async function (req, res, next) {
  //randomization des numéros de questions
  const indexList = [];
  while (indexList.length < 10) {
    randomNumber = Math.ceil(Math.random() * 17);
    const alreadyExists = indexList.find((e) => e === randomNumber);
    if (!alreadyExists) {
      indexList.push(randomNumber);
    }
  }

  //recherche des questions dans la BDD (à partir des numéros aléatoires d'indexList) et ajout dans un tableau à envoyer au front
  let result = false;
  const error = [];
  const questionsPromise = indexList.map(async (questionNumber) => {
    return await questionModel.findOne({
      //le fait d'avoir des fonctions asynchrones dans un .map génère des Promise
      index: questionNumber,
    });
  });
  const questionsArray = await Promise.all(questionsPromise); //le Promise.all permet de résoudre les promesses

  // message d'erreur si la génération de questions a totalement échouée
  if (!questionsArray || questionsArray.length === 0) {
    error.push("erreur : aucune question n'a été générée");
  }
  //message d'erreur si la génération de questions n'a fonctionné que partiellement
  if (questionsArray && questionsArray.length > 0 && questionsArray.length < 10) {
    error.push("erreur: une ou plusieurs questions n'ont pas été générées");
  }
  if (questionsArray && questionsArray.length === 10) {
    result = true;
  }
  res.json({ result, error, questionsArray });
});

router.post("/interviewsave-scoreandtrophy", async function (req, res, next) {
  let result = false;
  let user = null;
  let updateUserScore = null;
  let updateUserTrophies = null;
  let trophyId = "";
  let error = [];

  if (req.body.scoreFromFront == "") {
    error.push("pas de score");
    res.json({ result, user, error });
  }

  user = await userModel.findOne({ username: req.body.usernameFromFront });

  if (user) {
    //on fait une requête à la BDD pour trouver les scores si le user en a déjà et pusher le nouveau
    let scoresDataBase = user.scores;

    updateUserScore = scoresDataBase.push(req.body.scoreFromFront);

    updateUserScore = await userModel.updateOne({ username: req.body.usernameFromFront }, { scores: scoresDataBase });

    if (updateUserScore) {
      result = true;
      user = await userModel.findOne({ username: req.body.usernameFromFront }); //on refait une requête à la BDD pour envoyer au front le user mis à jour
    } else {
      error.push("le nouveau score n'a pas été enregistré");
      res.json({ result, user, error });
    }

    //on attribue les trophées de notre database grâce à leurs Ids en fonction du score obtenu
    if (req.body.scoreFromFront > 0 && req.body.scoreFromFront <= 50) {
      trophyId = "5fd2390e0e2ad830d8b1fc22";
    } else if (req.body.scoreFromFront > 50 && req.body.scoreFromFront <= 90) {
      trophyId = "5fd238e40e2ad830d8b1fc21";
    } else {
      trophyId = "5fd2382e0e2ad830d8b1fc20";
    }

    //on fait une requête à la BDD pour trouver les trophées si le user en a déjà et pusher le nouveau
    let trophiesDataBase = user.trophiesId;
    updateUserTrophies = trophiesDataBase.push(trophyId);
    updateUserTrophies = await userModel.updateOne(
      { username: req.body.usernameFromFront },
      { trophiesId: trophiesDataBase }
    );

    if (updateUserTrophies) {
      result = true;
      user = await userModel.findOne({ username: req.body.usernameFromFront }); //on refait une requête à la BDD pour envoyer au front le user mis à jour
    } else {
      error.push("le nouveau trophée n'a pas été enregistré");
    }
  } else {
    error.push("username incorrect");
  }

  res.json({ result, user, error });
});

router.post("/interviewfind-lasttrophy", async function (req, res, next) {
  let result = false;
  let user = null;
  let lastTrophyDataBase = null;
  let lastTrophyToShow = null;
  let error = [];

  user = await userModel.findOne({ username: req.body.usernameFromFront });

  if (user) {
    //on fait une requête à la BDD pour trouver les trophées du user et récupérer le dernier gagné pour l'afficher au user dans sa page résultat du dernier entretien
    let trophiesDataBase = user.trophiesId;
    lastTrophyDataBase = trophiesDataBase[trophiesDataBase.length - 1];

    lastTrophyToShow = await trophyModel.findById(lastTrophyDataBase);

    if (lastTrophyToShow) {
      result = true;
    } else {
      error.push("le nouveau trophée n'a pas été trouvé");
      res.json({ result, user, error });
    }
  } else {
    error.push("username incorrect");
  }

  res.json({ result, user, error, lastTrophyToShow });
});

module.exports = router;
