const mongoose = require('mongoose');

const QuoteSchema = new mongoose.Schema({
    content: {
        en: { type: String, required: true },
        he: { type: String, required: true }
    },

    // Relationship to Author
    philosopherId: { type: String, required: true },
    philosopher: { type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher' },

    // Relationship to Source (Work) - Optional, as some quotes are just spoken
    workId: { type: String },
    work: { type: mongoose.Schema.Types.ObjectId, ref: 'Work' },

    tags: [String]
});

module.exports = mongoose.model('Quote', QuoteSchema);
