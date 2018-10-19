const express = require("express");
const router = express.Router();

const Icebreaker = require("../models/icebreaker");
const Team = require("../models/team")
const Comment = require("../models/comment");
const User = require("../models/user");

router.get('/', function(req, res) {
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        
        Icebreaker.find({'$or':[
            {'team':{'$regex':regex, '$options':'i'}},
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

router.get('/new', isLoggedIn, function(req, res) {
    Team.find({}, function(err, teams){
        if(err){
            console.log(err);
        } else {
            res.render("icebreakers/new", {teams: teams, currentUser: req.user});
        }
    })
});

router.post('/', isLoggedIn, function(req, res) {
    req.body.icebreaker.text = req.body.icebreaker.text.replace(/\r?\n/g, '<br>');
    req.body.icebreaker.text = req.sanitize(req.body.icebreaker.text);
    req.body.icebreaker.author = {
        id: req.user.facebook.id,
        username: req.user.facebook.first_name
    }
    
    Team.findById(req.body.icebreaker.team, function(err, team) {
      if(err){
         console.log(err);
      } else {
            Icebreaker.create(req.body.icebreaker, function(err, newlyCreated) {
                if(err){
                    console.log(err);
                }else{
                    team.icebreakers.push(newlyCreated);
                    team.save();
                    res.redirect('/teams/' + req.body.icebreaker.team);
                }
            });
      }
    })
});

router.get('/:id', function(req, res) {
    Icebreaker.findById(req.params.id).populate('comments').exec(function(err, icebreaker){
        if(err || !icebreaker){
            console.log(err);
            res.render("misc/error", {currentUser: req.user});
        }else{
            res.render('icebreakers/show', {icebreaker:icebreaker,currentUser: req.user});
        }
    })
});

router.get('/:id/edit', function(req, res) {
    Icebreaker.findById(req.params.id, function(err, icebreaker){
        if(err || !icebreaker){
            console.log(err);
            res.render("misc/error", {currentUser: req.user});
        }else{
            Team.find({}, function(err, teams){
                if(err){
                    console.log(err);
                } else {
                    res.render('icebreakers/edit', {icebreaker:icebreaker, teams: teams, currentUser: req.user});
                }
            })
        }
    })
})

router.put('/:id', isLoggedIn, function(req, res){
    req.body.icebreaker.text = req.body.icebreaker.text.replace(/\r?\n/g, '<br>');
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

router.delete('/:id', isLoggedIn, function(req, res){
    Icebreaker.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect('/icebreakers');
        }
    })
})

function isLoggedIn(req, res, next) {
    if (req.user)
        return next();
    res.redirect('/please_login');
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;