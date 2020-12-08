var express = require('express');
var router = express.Router();

var uid2 = require('uid2')
var SHA256 = require('crypto-js/sha256')
var encBase64 = require('crypto-js/enc-base64')

var userModel = require('../models/users')


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

module.exports = router;
