const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
    leaderMail: {
        type: String,
        required: true
    },
    leaderName: {
        type: String,
        required: true
    },
    playerMail: {
        type: String,
        required: true
    },
    playerName: {
        type: String,
        required: true
    },
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Event'
    }

})

module.exports = mongoose.model('Token', tokenSchema);