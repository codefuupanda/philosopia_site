// F:\philosopia_site\philosopia-api\models\School.js
const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. "stoicism"
  nameEn: { type: String, required: true }, // Deprecated
  nameHe: { type: String, required: true }, // Deprecated

  name: {
    en: String,
    he: String
  },

  descriptionEn: String, // Deprecated
  descriptionHe: String, // Deprecated

  description: {
    en: String,
    he: String
  },

  periodId: { type: String, required: true },
  period: { type: mongoose.Schema.Types.ObjectId, ref: 'Period' },

  wikidataId: String,

  // Enhanced Data
  yearsEn: String,
  yearsHe: String,
  locationEn: String,
  locationHe: String,
  famousQuoteEn: String,
  famousQuoteHe: String
});

module.exports = mongoose.model('School', SchoolSchema);