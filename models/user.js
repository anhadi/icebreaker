var mongoose = require("mongoose");
 
var userSchema = mongoose.Schema({
     facebook: {
         id: String,
         token: String,
         first_name: String,
         last_name: String,
         email: String
     }
})
 
 var User = mongoose.model('User', userSchema);
 
 module.exports = User;