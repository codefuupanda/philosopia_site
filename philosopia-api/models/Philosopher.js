import mongoose from 'mongoose';

const WikidataRelationSchema = new mongoose.Schema({
    qid: { type: String, required: true },
    labelEn: { type: String, required: true },
    labelHe: { type: String, required: true }
}, { _id: false });

const PhilosopherSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    nameEn: { type: String, required: true },
    nameHe: { type: String, required: true },

    name: {
        en: String,
        he: String
    },

    schoolId: { type: String, required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },

    periodId: { type: String, required: true },
    period: { type: mongoose.Schema.Types.ObjectId, ref: 'Period' },

    yearsEn: String,
    yearsHe: String,
    years: {
        en: String,
        he: String
    },

    summaryEn: String,
    summaryHe: String,
    summary: {
        en: String,
        he: String
    },
    manualSummary: {
        en: String,
        he: String
    },

    keyIdeasEn: [String],
    keyIdeasHe: [String],
    keyIdeas: {
        en: [String],
        he: [String]
    },

    quotesEn: [String],
    quotesHe: [String],
    quotes: {
        en: [String],
        he: [String]
    },

    wikiTitle: { type: String, required: true },
    wikiQid: { type: String, index: true },
    bioHtml: String,
    bioText: String,

    manualImageUrl: String,
    enrichedImageUrl: String,
    imageUrl: String,

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

    countryOfCitizenship: [WikidataRelationSchema],
    influencedBy: [WikidataRelationSchema],
    students: [WikidataRelationSchema],
    foundationalTexts: [WikidataRelationSchema],
    religion: [WikidataRelationSchema],

    lastEnriched: { type: Date, default: Date.now },
});

PhilosopherSchema.index({ "name.en": "text", "name.he": "text", bioText: "text" });

export default mongoose.model('Philosopher', PhilosopherSchema);
