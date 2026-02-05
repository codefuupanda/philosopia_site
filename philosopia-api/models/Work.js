import mongoose from 'mongoose';

const WorkSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: {
        en: { type: String, required: true },
        he: { type: String, required: true }
    },

    philosopherId: { type: String, required: true },
    philosopher: { type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher' },

    publicationYear: String,
    wikiLink: String
});

export default mongoose.model('Work', WorkSchema);
