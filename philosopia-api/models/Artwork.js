import mongoose from 'mongoose';

const artworkSchema = new mongoose.Schema({
    id: {
        type: String,
        required: false,
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
        required: true
    },
    philosopher: {
        type: String,
        required: false
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
        required: false
    },
    warning: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

export default mongoose.model('Artwork', artworkSchema);
