import mongoose from 'mongoose';

const QuoteSchema = new mongoose.Schema({
    content: {
        en: { type: String, required: true },
        he: { type: String, required: true }
    },

    philosopherId: { type: String, required: true },
    philosopher: { type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher' },

    workId: { type: String },
    work: { type: mongoose.Schema.Types.ObjectId, ref: 'Work' },

    tags: [String]
});

export default mongoose.model('Quote', QuoteSchema);
