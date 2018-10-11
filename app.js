const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const passport = require('passport');
const FacebookStrategy = require("passport-facebook").Strategy;
const expressSanitizer = require("express-sanitizer");

const Icebreaker = require("./models/icebreaker");
const Comment = require("./models/comment");
const User = require("./models/user");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

app.set('view engine', 'ejs');

app.use(require("express-session")({
    secret : 'asdfasdfasdfasdfsdf',
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

mongoose.connect('mongodb://process.env.DBUSER:process.env.DBPASSWORD@ds123603.mlab.com:23603/icebreaker', { useNewUrlParser: true });



// ---------------------------------------------------- auth routes

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

function isLoggedIn(req, res, next) {
    if (req.user)
        return next();
    res.redirect('/please_login');
}

// ---------------------------------------------------- icebreakers routes

app.get('/', function(req, res) {
    res.redirect('/icebreakers');
})

app.get('/icebreakers', function(req, res) {
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
        Icebreaker.find({'$or':[
            {'team':{'$regex':regex, '$options':'i'}},
            {'title':{'$regex':regex, '$options':'i'}},
            {'text':{'$regex':regex, '$options':'i'}},
            {'question':{'$regex':regex, '$options':'i'}},
            {'author.username':{'$regex':regex, '$options':'i'}}]}, null, {sort: {createdAt: -1}}, function(err, icebreakers){
            if(err){
                console.log(err);
            } else {
                res.status(200).render("icebreakers/index", {icebreakers:icebreakers, displayButton:true, currentUser: req.user});
            }
        })
    } else {
        Icebreaker.find({}, null, {sort: {createdAt: -1}}, function(err, icebreakers){
            if(err){
                console.log(err);
            } else {
                res.status(200).render("icebreakers/index", {icebreakers:icebreakers, displayButton:false,currentUser: req.user});
            }
        })
    }
});

app.get('/icebreakers/new', isLoggedIn, function(req, res) {
    res.render("icebreakers/new", {currentUser: req.user});
});

app.post('/icebreakers', isLoggedIn, function(req, res) {
    req.body.icebreaker.text = req.sanitize(req.body.icebreaker.text);
    req.body.icebreaker.author = {
        id: req.user.facebook.id,
        username: req.user.facebook.first_name
    }
    
    Icebreaker.create(req.body.icebreaker, function(err, newlyCreated) {
        if(err){
            console.log(err);
        }else{
            res.redirect("/icebreakers");
        }
    });
});

app.get('/icebreakers/:id', function(req, res) {
    Icebreaker.findById(req.params.id).populate('comments').exec(function(err, icebreaker){
        if(err || !icebreaker){
            console.log(err);
            res.send("error or no icebreaker");
        }else{
            res.render('icebreakers/show', {icebreaker:icebreaker,currentUser: req.user});
        }
    })
});

app.get('/icebreakers/:id/edit', function(req, res) {
    Icebreaker.findById(req.params.id, function(err, icebreaker){
        if(err || !icebreaker){
            console.log(err);
            res.send('error or no icebreaker')
        }else{
            res.render('icebreakers/edit', {icebreaker:icebreaker,currentUser: req.user});
        }
    })
})

app.put('/icebreakers/:id', function(req, res){
    req.body.icebreaker.text = req.sanitize(req.body.icebreaker.text);
    
    Icebreaker.findByIdAndUpdate(req.params.id, req.body.icebreaker, function(err, updatedIcebreaker){
        if(err || !updatedIcebreaker){
            console.log(err);
            res.send("unable to update icebreaker")
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

app.post('/icebreakers/:id/comments', isLoggedIn, function(req, res) {
    req.body.comment.author = {
        id: req.user.facebook.id,
        username: req.user.facebook.first_name
    }
    
    
    Icebreaker.findById(req.params.id, function(err, icebreaker) {
        if(err || !icebreaker){
            console.log(err);
        }else{
            Comment.create(req.body.comment, function(err, comment){
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
        if(err || !icebreaker){
            console.log(err);
            res.send('error or no icebreaker');
        }else{
            Comment.findById(req.params.comment_id, function(err, comment) {
                if(err || !comment){
                    console.log(err);
                    res.send('error or no comment');
                } else {
                    res.render('comments/edit', {icebreaker:icebreaker, comment:comment,currentUser: req.user})
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

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = {app}
