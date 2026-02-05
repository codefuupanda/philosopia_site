import mongoose from 'mongoose';

const ConceptSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nameEn: { type: String, required: true },
  nameHe: { type: String, required: true },
  name: {
    en: String,
    he: String
  },

  summaryEn: String,
  summaryHe: String,
  summary: {
    en: String,
    he: String
  },

  descriptionEn: String,
  descriptionHe: String,
  description: {
    en: String,
    he: String
  },

  originDateEn: String,
  originDateHe: String,
  domainEn: String,
  domainHe: String,

  relatedPhilosopherIds: [String],
  relatedPhilosophers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher' }]
});

export default mongoose.model('Concept', ConceptSchema);
