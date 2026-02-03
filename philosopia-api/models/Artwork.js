const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
    id: {
        type: String,
        required: false, // Optional for now, will be populated
        unique: true,
        sparse: true
    },
    title: {
        type: String,
        required: true
    },
    artist: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true,
        help: "The exact filename on Wikimedia Commons"
    },
    philosopher: { // Deprecated string field
        type: String,
        required: false,
        help: "Name of the philosopher this artwork is related to"
    },
    relatedPhilosopherIds: [String],
    relatedPhilosophers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher' }],
    status: {
        type: String,
        enum: ['pd', 'pd-us-only', 'copyrighted'],
        default: 'pd',
        required: true
    },
    externalLink: {
        type: String,
        required: false,
        help: "Link to museum page for copyrighted works"
    },
    warning: {
        type: String,
        required: false,
        help: "Warning message for restricted content"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Artwork', artworkSchema);
