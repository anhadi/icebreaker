const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

const Icebreaker = require("./models/icebreaker");
const Comment = require("./models/comment");

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));

app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/icebreaker', { useNewUrlParser: true });


// ---------------------------------------------------- icebreakers routes

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

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The Icebreaker server is up!");
});


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
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect('/icebreakers/' + req.params.id);
        }
    })
})

module.exports = {app}
