const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
    text: String, 
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            reff: 'User'
        },
        username: String
    }
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;