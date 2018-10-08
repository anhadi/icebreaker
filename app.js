const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const passport = require('passport');
const FacebookStrategy = require("passport-facebook").Strategy;

const Icebreaker = require("./models/icebreaker");
const Comment = require("./models/comment");
const User = require("./models/user");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
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
        clientID        : process.env.FACEBOOK_APP_ID,
        clientSecret    : process.env.FACEBOOK_APP_SECRET,
        callbackURL     : process.env.CALLBACKURL,
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

mongoose.connect('mongodb://localhost:27017/icebreaker', { useNewUrlParser: true });



// ---------------------------------------------------- auth routes

app.get('/auth/facebook', passport.authenticate('facebook', { 
  scope : ['public_profile', 'email']
}));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/secret',
    failureRedirect : '/icebreakers'
}));

app.get('/secret', isLoggedIn, function(req, res) {
    res.send('You reached the success route')
})

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

// ---------------------------------------------------- icebreakers routes

app.get('/', function(req, res) {
    res.redirect('/icebreakers');
})

app.get('/icebreakers', function(req, res) {
    Icebreaker.find({}, function(err, icebreakers){
        if(err){
            console.log(err);
        } else {
            res.status(200).render("icebreakers/index", {icebreakers:icebreakers});
        }
    });
});

app.get('/icebreakers/new', function(req, res) {
    res.render("icebreakers/new");
});

app.post('/icebreakers', function(req, res) {
    var text = req.body.text;
    
    Icebreaker.create({text:text}, function(err, newlyCreated) {
        if(err){
            console.log(err);
        }else{
            res.redirect("/icebreakers");
        }
    });
});

app.get('/icebreakers/:id', function(req, res) {
    Icebreaker.findById(req.params.id).populate('comments').exec(function(err, icebreaker){
        if(err){
            console.log(err);
        }else{
            res.render('icebreakers/show', {icebreaker:icebreaker});
        }
    })
});

app.get('/icebreakers/:id/edit', function(req, res) {
    Icebreaker.findById(req.params.id, function(err, icebreaker){
        if(err){
            console.log(err);
        }else{
            res.render('icebreakers/edit', {icebreaker:icebreaker});
        }
    })
})

app.put('/icebreakers/:id', function(req, res){
    Icebreaker.findByIdAndUpdate(req.params.id, {text: req.body.text}, function(err, updatedIcebreaker){
        if(err){
            console.log(err);
        }else{
            res.redirect('/icebreakers/'+updatedIcebreaker._id);
        }
    })
})

app.delete('/icebreakers/:id', function(req, res){
    Icebreaker.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect('/icebreakers');
        }
    })
})

// ---------------------------------------------------- comments routes

app.post('/icebreakers/:id/comments', function(req, res) {
    var text = req.body.text;
    
    Icebreaker.findById(req.params.id, function(err, icebreaker) {
        if(err){
            console.log(err);
        }else{
            Comment.create({text:text}, function(err, comment){
                if(err){
                    console.log(err);
                } else {
                    icebreaker.comments.push(comment);
                    icebreaker.save();
                    res.redirect('/icebreakers/' + req.params.id);
                }
            }) 
        }
    })
})

app.get('/icebreakers/:id/comments/:comment_id/edit', function(req, res) {
    Icebreaker.findById(req.params.id, function(err, icebreaker) {
        if(err){
            console.log(err);
        }else{
            Comment.findById(req.params.comment_id, function(err, comment) {
                if(err){
                    console.log(err);
                } else {
                    res.render('comments/edit', {icebreaker:icebreaker, comment:comment})
                }
            })
        }
    });
});

app.put('/icebreakers/:id/comments/:comment_id', function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, {text: req.body.text}, function(err, comment){
        if(err){
            console.log(err);
        }else{
            res.redirect('/icebreakers/' + req.params.id);
        }
    });
});

app.delete('/icebreakers/:id/comments/:comment_id', function(req, res){
    Icebreaker.findByIdAndUpdate(req.params.id, { $pull: { comments: req.params.comment_id  } }, function(err, icebreaker) {
        if(err){
            console.log(err);
        } else {
            Comment.findByIdAndRemove(req.params.comment_id, function(err){
                if(err){
                    console.log(err);
                }else{
                    res.redirect('/icebreakers/' + req.params.id);
                }
            })
        }
    })
})

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The Icebreaker server is up!");
});

module.exports = {app}
