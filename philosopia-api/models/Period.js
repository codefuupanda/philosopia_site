const mongoose = require('mongoose');

const PeriodSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  wikidataId: { type: String, unique: true, sparse: true }, // For syncing with Wikidata
  nameEn: { type: String, required: true }, // Deprecated
  nameHe: { type: String, required: true }, // Deprecated
  name: {
    en: String,
    he: String
  },

  descriptionHe: String, // Deprecated
  descriptionEn: String, // Deprecated
  description: {
    en: String,
    he: String
  },

  // These are required for the Timeline to work:
  startYear: { type: Number, required: true },
  endYear: { type: Number, required: true }
});

module.exports = mongoose.model('Period', PeriodSchema);