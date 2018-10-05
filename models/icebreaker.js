var mongoose = require("mongoose");

var icebreakerSchema = mongoose.Schema({
    text: String,
    image: String,
    createdAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
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

var Icebreaker = mongoose.model("Icebreaker", icebreakerSchema);

module.exports = Icebreaker;