const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
    text: String, 
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: String,
            reff: 'User'
        },
        username: String
    }
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;