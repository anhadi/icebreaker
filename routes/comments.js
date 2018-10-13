const express = require("express");
const router = express.Router({mergeParams:true});

const Icebreaker = require("../models/icebreaker");
const Team = require("../models/team")
const Comment = require("../models/comment");
const User = require("../models/user"); 

router.post('/', isLoggedIn, function(req, res) {
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

router.get('/:comment_id/edit', function(req, res) {
    Icebreaker.findById(req.params.id, function(err, icebreaker) {
        if(err || !icebreaker){
            console.log(err);
            res.render("misc/error", {currentUser: req.user});
        }else{
            Comment.findById(req.params.comment_id, function(err, comment) {
                if(err || !comment){
                    console.log(err);
                    res.render("misc/error", {currentUser: req.user});
                } else {
                    res.render('comments/edit', {icebreaker:icebreaker, comment:comment,currentUser: req.user})
                }
            })
        }
    });
});

router.put('/:comment_id', function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, {text: req.body.text}, function(err, comment){
        if(err){
            console.log(err);
        }else{
            res.redirect('/icebreakers/' + req.params.id);
        }
    });
});

router.delete('/:comment_id', function(req, res){
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

function isLoggedIn(req, res, next) {
    if (req.user)
        return next();
    res.redirect('/please_login');
}

module.exports = router;