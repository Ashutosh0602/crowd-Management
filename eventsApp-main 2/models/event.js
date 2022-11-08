const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    date: String,
    time: String,
    add: {
        city: String,
        zip: String,
        state: String
    },
    description: {
        type: String,
        required: true
    },
    image:
    {
        path: String,
        filename: String,
    }

});

module.exports = mongoose.model('Event', eventSchema);