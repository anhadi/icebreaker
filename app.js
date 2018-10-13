const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const passport = require('passport');
const FacebookStrategy = require("passport-facebook").Strategy;
const expressSanitizer = require("express-sanitizer");

const Icebreaker = require("./models/icebreaker");
const Team = require("./models/team")
const Comment = require("./models/comment");
const User = require("./models/user");
const icebreakerRoutes = require("./routes/icebreakers");
const commentRoutes = require("./routes/comments");
const teamRoutes = require("./routes/teams");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

app.set('view engine', 'ejs');

app.use(require("express-session")({
    secret : process.env.SECRET,
    resave : false, 
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : process.env.FACEBOOK_CLIENTID,
        clientSecret    : process.env.FACEBOOK_CLIENTSECRET,
        callbackURL     : 'https://icebreaker-ahadi.c9users.io:8080/auth/facebook/callback',
        profileFields : ['id','email', 'name']

    },
    function(token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser            = new User();

                    // set all of the facebook information in our user model
                    newUser.facebook.id    = profile.id; // set the users facebook id                   
                    newUser.facebook.token = token; // we will save the token that facebook provides to the user  
                    newUser.facebook.first_name  = profile.name.givenName; // look at the passport user profile to see how names are returned
                    newUser.facebook.last_name  = profile.name.familyName; // look at the passport user profile to see how names are returned
                    newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                    // save our user to the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        return done(null, newUser);
                    });
                }

            });
        });

    }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

mongoose.connect(process.env.DBURL, { useNewUrlParser: true });

app.use('/icebreakers', icebreakerRoutes);
app.use('/icebreakers/:id/comments', commentRoutes);
app.use('/teams', teamRoutes);

app.get('/please_login', function(req, res) {
    res.render("misc/pleaseLogin", {currentUser: req.user});
});

app.get('/auth/facebook', passport.authenticate('facebook', { 
  scope : ['public_profile', 'email']
}));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/icebreakers',
    failureRedirect : '/icebreakers'
}));

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect("back");
});

app.get('/', function(req, res) {
    res.redirect('/icebreakers');
})

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The Icebreaker server is up!");
});


module.exports = {app}
