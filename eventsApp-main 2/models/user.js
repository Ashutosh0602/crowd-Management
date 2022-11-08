const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    college: String,
    registeredEvents: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Event'
        }
    ],
    hostedEvents: [{

        type: Schema.Types.ObjectId,
        ref: 'Event'

    }],

    desc: String
})

User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);
