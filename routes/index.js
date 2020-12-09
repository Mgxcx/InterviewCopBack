var express = require('express');
var router = express.Router();

var uid2 = require('uid2')
var SHA256 = require('crypto-js/sha256')
var encBase64 = require('crypto-js/enc-base64')

var userModel = require('../models/users')
var questionModel = require('../models/questions')


router.post('/sign-up', async function(req,res,next){

  var error = []
  var result = false
  var saveUser = null

  const data = await userModel.findOne({
    username: req.body.usernameFromFront
  })

  if(data != null){
    error.push('utilisateur déjà présent')
  }

  if(req.body.usernameFromFront == ''
  || req.body.passwordFromFront == ''
  ){
    error.push('champs vides')
  }


  if(error.length == 0){
    var salt = uid2(32)
    var newUser = new userModel({
      username: req.body.usernameFromFront,
      password: SHA256(req.body.passwordFromFront+salt).toString(encBase64),
      salt: salt,
      secret_question: req.body.secret_question,        
      secret_question_answer: req.body.secret_question_answer     
    })
  
    saveUser = await newUser.save()
  
    
    if(saveUser){
      result = true
    }
  }
  

  res.json({result, saveUser, error})
})

router.post('/sign-in', async function(req,res,next){

  var result = false
  var user = null
  var error = []
  
  if(req.body.usernameFromFront == ''
  || req.body.passwordFromFront == ''
  ){
    error.push('champs vides')
  }

  if(error.length == 0){
    const user = await userModel.findOne({
      username: req.body.usernameFromFront,
    })
  
    
    if(user){
      const passwordEncrypt = SHA256(req.body.passwordFromFront + user.salt).toString(encBase64)

      if(passwordEncrypt == user.password){
        result = true
      } else {
        result = false
        error.push('mot de passe incorrect')
      }
      
    } else {
      error.push('username incorrect')
    }
  }
  res.json({result, user, error})
})

router.get('/generate-questions', async function(req,res,next){
  //randomization des numéros de questions 
  const indexList = [];
  while (indexList.length < 10) {
    randomNumber = Math.ceil(Math.random()*17);
    const alreadyExists = indexList.find(e => e === randomNumber);
    if (!alreadyExists){
      indexList.push(randomNumber)
    };
  }

  //recherche des questions dans la BDD (à partir des numéros aléatoires d'indexList) et ajout dans un tableau à envoyer au front
  let result = false;
  const error = [];
  const questionsPromise = indexList.map( async (questionNumber) => {   
    return await questionModel.findOne({                                //le fait d'avoir des fonctions asynchrones dans un .map génère des Promise
      index: questionNumber
    })
  });  
  const questionsArray = await Promise.all(questionsPromise);           //le Promise.all permet de résoudre les promesses

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
  res.json({result, error, questionsArray})
})

module.exports = router;
