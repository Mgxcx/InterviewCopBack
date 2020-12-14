var express = require("express");
var router = express.Router();

var uid2 = require("uid2");
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");

const cheerio = require("cheerio");
const fetch = require("node-fetch");

var userModel = require("../models/users");
var questionModel = require("../models/questions");
var trophyModel = require("../models/trophies");
const adviceModel = require("../models/advice");
var packageModel = require("../models/packages");
var icopModel = require("../models/icops");

router.post("/sign-up", async function (req, res, next) {
  let error = [];
  let result = false;
  let saveUser = null;

  const data = await userModel.findOne({
    username: req.body.usernameFromFront,
  });

  if (data != null) {
    error.push("Utilisateur déjà présent");
  }

  if (req.body.usernameFromFront == "" || req.body.passwordFromFront == "") {
    error.push("Champs vides");
  }

  if (error.length == 0) {
    let salt = uid2(32);
    let newUser = new userModel({
      username: req.body.usernameFromFront,
      password: SHA256(req.body.passwordFromFront + salt).toString(encBase64),
      salt: salt,
      secret_question: req.body.secret_question,
      secret_question_answer: req.body.secret_question_answer,
      package: "5fd776ffe2b67bdc3438888b",
      icopsId: ["5fcfb0f8693759e1b46eeabb"],
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
    error.push("Champs vides");
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
        error.push("Mot de passe incorrect");
      }
    } else {
      error.push("Username incorrect");
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
    error.push("Champs vides");
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
      error.push("Champs incorrects");
    }
  }
  res.json({ result, user, error });
});

router.post("/new-password", async function (req, res, next) {
  let result = false;
  let user = null;
  let error = [];

  if (req.body.newPasswordFromFront == "") {
    error.push("Champ vide");
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
      error.push("Votre nouveau mot de passe n'a pas été enregistré");
    }
  }

  res.json({ result, user, error });
});

router.post("/update-userdata", async function (req, res, next) {
  let result = false;
  let user = null;
  let updateUser = null;
  let error = [];

  if (req.body.jobFromFront == "" || req.body.salaryFromFront == "" || req.body.countyFromFront == "") {
    error.push("Un ou plusieurs champs sont vides");
  }

  if (error.length == 0) {
    user = await userModel.findOne({ username: req.body.usernameFromFront });

    if (user) {
      updateUser = await userModel.updateOne(
        { username: req.body.usernameFromFront },
        {
          job: req.body.jobFromFront,
          salary: req.body.salaryFromFront,
          county: req.body.countyFromFront,
        }
      );
      if (updateUser) {
        result = true;
        user = await userModel.findOne({ username: req.body.usernameFromFront }); //on refait une requête à la BDD pour envoyer au front le user mis à jour
      }
    } else {
      error.push("L'enregistrement des données a échoué");
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
    error.push("Aucune question n'a été générée");
  }
  //message d'erreur si la génération de questions n'a fonctionné que partiellement
  if (questionsArray && questionsArray.length > 0 && questionsArray.length < 10) {
    error.push("Une ou plusieurs questions n'ont pas été générées");
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
    error.push("Pas de nouveau score");
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
      error.push("Votre nouveau score n'a pas été enregistré");
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
      error.push("Votre nouveau trophée n'a pas été enregistré");
    }
  } else {
    error.push("Username incorrect");
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
      error.push("Votre nouveau trophée n'a pas été trouvé");
      res.json({ result, user, error });
    }
  } else {
    error.push("Username incorrect");
  }

  res.json({ result, user, error, lastTrophyToShow });
});

//réalise un scraping du site keljob.com pour afficher un salaire moyen selon le métier et la région de l'utilisateur
router.get("/scrape-salary", async function (req, res, next) {
  let result = false;
  const error = [];

  //ciblage sur les salaires pratiqués dans les grandes villes (pour obtenir des données de salaire significatives)
  let city = "";
  if (req.query.county === "Hauts-de-France") {
    city = "Lille";
  } else if (req.query.county === "Normandie") {
    city = "Rouen";
  } else if (req.query.county === "Ile-de-France") {
    city = "Paris";
  } else if (req.query.county === "Grand Est") {
    city = "Strasbourg";
  } else if (req.query.county === "Bretagne") {
    city = "Rennes";
  } else if (req.query.county === "Pays de la Loire") {
    city = "Nantes";
  } else if (req.query.county === "Centre-Val de Loire") {
    city = "Orléans";
  } else if (req.query.county === "Bourgogne-Franche-Comte") {
    city = "Dijon";
  } else if (req.query.county === "Nouvelle-Aquitaine") {
    city = "Bordeaux";
  } else if (req.query.county === "Auvergne-Rhone-Alpes") {
    city = "Lyon";
  } else if (req.query.county === "Occitanie") {
    city = "Toulouse";
  } else if (req.query.county === "Provence-Alpes-Cote d'Azur") {
    city = "Marseille";
  } else if (req.query.county === "Corse") {
    city = "Ajaccio";
  } else {
    city = "Fort-de-France";
  } // valeur pour l'input "DOM-TOM" venant du front

  //mise en forme de la string "job" pour correspondre avec les url de keljob
  const job = req.query.job.toLowerCase();

  const data = await fetch(`https://www.keljob.com/recherche-salaire?q=${job}&l=${city}`);
  const $ = cheerio.load(await data.text());
  const salary = $(".row .data")
    .get()
    .map((e) => {
      const $e = $(e);
      const salaryText = $e.find("strong").text();
      return salaryText;
    });

  if (salary[0]) {
    result = true;
    res.json({ result, error, salary: salary[0] });
  } else {
    error.push("Aucun salaire trouvé pour le métier et la région indiquée");
    res.json({ result, error });
  }
});

router.get("/accountfind-informationdatabase", async function (req, res, next) {
  let result = false;
  let user = null;
  let scoresDataBase = null;
  let trophiesDataBase = null;
  let icopsDataBase = null;
  let packageDataBase = null;
  let error = [];

  user = await userModel.findOne({ username: req.query.usernameFromFront });

  if (user) {
    //on fait une requête à la BDD pour trouver les scores, trophées, icops et package du user
    // pour les afficher dans sa page Mon Compte
    scoresDataBase = user.scores;
    trophiesDataBase = user.trophiesId;
    let icopsDataBaseId = user.icopsId;
    let packageDataBaseId = user.package;

    packageDataBase = await packageModel.findById(packageDataBaseId);
    icopsDataBase = await icopModel.findById(icopsDataBaseId);

    if (scoresDataBase || trophiesDataBase || icopsDataBase || packageDataBase) {
      result = true;
      if (scoresDataBase.length == 0) {
        error.push("Vous n'avez pas encore de scores!");
      }
      if (trophiesDataBase.length == 0) {
        error.push("Vous n'avez pas encore de trophées!");
      }
      if (!icopsDataBase) {
        error.push("Vos icops n'ont pas été trouvés");
      }
      if (!packageDataBase) {
        error.push("Votre package n'a pas été trouvé");
      }
    } else {
      error.push("Vous n'avez pas encore de score, de trophée, d'icop ou de package");
      res.json({ result, user, error });
    }
  } else {
    error.push("Username incorrect");
  }

  res.json({ result, user, error, scoresDataBase, trophiesDataBase, icopsDataBase, packageDataBase });
});

router.get("/advices", async function (req, res, next) {
  const advice = await adviceModel.find();
})

module.exports = router;
