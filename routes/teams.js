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
        Team.find({}, null, {sort: {createdAt: -1}}, function(err, teams){
            if(err){
                console.log(err);
            } else {
                res.status(200).render("teams/index", {teams:teams, displayButton:false,currentUser: req.user});
            }
        })
    }
});

router.get('/new', function(req, res) {
    res.render('teams/new', {currentUser: req.user});
})

router.post('/', function(req, res, next) {
    var teamName = req.body.teamName;
    var team = new Team({
      teamName : req.body.teamName
    })
    
    team.save(function(err){
       if(err) return res.send('Error')
       return res.redirect('/teams')
    })
})


router.get('/:team_id', function(req, res) {
    Team.findById(req.params.team_id).populate('icebreakers').exec(function(err, team){
        if(err || !team){
            console.log(err);
            res.render("misc/error", {currentUser: req.user});
        }else{
            res.render('teams/show', {team:team,currentUser: req.user});
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