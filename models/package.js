const mongoose = require('mongoose')

const packageSchema = mongoose.Schema({
    name: String,                    //nom de la formule (Free, Plus ou Premium)
    price: Number,                   //tarif de la formule
    users_quantity: Number,          //nombre de users 
    daily_interview_count: Number,    //nombre d'entretiens possibles par jour
    advanced_reports: Boolean,        //accès aux rapports apprfondis (oui ou non)
    personal_coach: Boolean           //accès au coach personnel (oui ou non)
})

const packageModel = mongoose.model('package', packageSchema)

module.exports = packageModel