const mongoose = require('mongoose');

// Define a schema for relational data fetched from Wikidata
const WikidataRelationSchema = new mongoose.Schema({
    qid: { type: String, required: true },
    labelEn: { type: String, required: true },
    labelHe: { type: String, required: true }
}, { _id: false });

const PhilosopherSchema = new mongoose.Schema({
    // --- Core Identifiers ---
    id: { type: String, required: true, unique: true },
    nameEn: { type: String, required: true }, // Deprecated
    nameHe: { type: String, required: true }, // Deprecated

    // New Multilingual Name
    name: {
        en: String,
        he: String
    },

    schoolId: { type: String, required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },

    periodId: { type: String, required: true },
    period: { type: mongoose.Schema.Types.ObjectId, ref: 'Period' },

    // --- Content Fields ---
    yearsEn: String, // Deprecated
    yearsHe: String, // Deprecated
    years: {
        en: String,
        he: String
    },

    summaryEn: String, // Deprecated
    summaryHe: String, // Deprecated
    summary: {
        en: String,
        he: String
    },
    manualSummary: {
        en: String,
        he: String
    },

    keyIdeasEn: [String], // Deprecated
    keyIdeasHe: [String], // Deprecated
    keyIdeas: {
        en: [String],
        he: [String]
    },

    // ✅ NEW: Quotes Arrays
    quotesEn: [String], // Deprecated
    quotesHe: [String], // Deprecated
    quotes: {
        en: [String],
        he: [String]
    },

    // --- Wikidata Integration ---
    wikiTitle: { type: String, required: true },
    wikiQid: { type: String, index: true },
    bioHtml: String,
    bioText: String,

    // Images
    manualImageUrl: String,
    enrichedImageUrl: String,
    imageUrl: String, // Legacy/Fallback

    // Extended Wiki Data
    wikiData: {
        bioEn: String,
        bioHe: String,
        imageUrl: String,
        wikiLinkEn: String,
        wikiLinkHe: String,
        extendedEn: {
            fullIntro: String,
            infobox: Object
        },
        extendedHe: {
            fullIntro: String,
            infobox: Object
        }
    },

    // --- Relations (Strategy 2) ---
    countryOfCitizenship: [WikidataRelationSchema],
    influencedBy: [WikidataRelationSchema],
    students: [WikidataRelationSchema],
    foundationalTexts: [WikidataRelationSchema],
    religion: [WikidataRelationSchema],

    // --- Metadata ---
    lastEnriched: { type: Date, default: Date.now },
});

// Add text index for search
PhilosopherSchema.index({ "name.en": "text", "name.he": "text", bioText: "text" });

module.exports = mongoose.model('Philosopher', PhilosopherSchema);