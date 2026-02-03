const mongoose = require('mongoose');

const WorkSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Slug
    title: {
        en: { type: String, required: true },
        he: { type: String, required: true }
    },

    // Relationship to Author
    philosopherId: { type: String, required: true },
    philosopher: { type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher' },

    publicationYear: String,
    wikiLink: String
});

module.exports = mongoose.model('Work', WorkSchema);
