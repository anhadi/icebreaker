const mongoose = require("mongoose");

const teamSchema = mongoose.Schema({
    teamName: String,
    icebreakers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Icebreaker"
        }
    ],
    createdAt: { type: Date, default: Date.now },
    creator: {
        id: {
            type: String,
            ref: 'User'
        },
        username: String
    }
});

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;