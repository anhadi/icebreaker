const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
var app = express();

const Icebreaker = require("./models/icebreaker");

mongoose.connect('mongodb://localhost:27017/icebreaker', { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

app.get('/icebreakers', function(req, res) {
    Icebreaker.find({}, function(err, icebreakers){
        if(err){
            console.log(err);
        } else {
            res.render("icebreakers/index", {icebreakers:icebreakers});
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
            console.log(newlyCreated);
            res.redirect("/icebreakers");
        }
    });
});

app.get('/icebreakers/:id', function(req, res) {
    Icebreaker.findById(req.params.id, function(err, icebreaker){
        if(err){
            console.log(err);
        } else {
            res.render('icebreakers/show', {icebreaker:icebreaker});
        }
    })
})

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The Icebreaker server is up!");
})