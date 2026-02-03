const mongoose = require('mongoose');

const ConceptSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nameEn: { type: String, required: true }, // Deprecated
  nameHe: { type: String, required: true }, // Deprecated
  name: {
    en: String,
    he: String
  },

  summaryEn: String, // Short definition // Deprecated
  summaryHe: String, // Deprecated
  summary: {
    en: String,
    he: String
  },

  descriptionEn: String, // Long explanation (optional) // Deprecated
  descriptionHe: String, // Deprecated
  description: {
    en: String,
    he: String
  },

  // Enhanced Data
  originDateEn: String,
  originDateHe: String,
  domainEn: String, // e.g. "Metaphysics", "Ethics"
  domainHe: String,

  // The Link: Which philosophers are famous for this?
  relatedPhilosopherIds: [String], // Stable String IDs
  relatedPhilosophers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher' }]
});

module.exports = mongoose.model('Concept', ConceptSchema);