const mongoose = require("mongoose");

const icebreakerSchema = mongoose.Schema({
    team: String,
    title: String,
    text: String,
    question: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: String,
            ref: 'User'
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

const Icebreaker = mongoose.model("Icebreaker", icebreakerSchema);

module.exports = Icebreaker;