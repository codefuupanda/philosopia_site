import mongoose from 'mongoose';

const SchoolSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nameEn: { type: String, required: true },
  nameHe: { type: String, required: true },

  name: {
    en: String,
    he: String
  },

  descriptionEn: String,
  descriptionHe: String,

  description: {
    en: String,
    he: String
  },

  periodId: { type: String, required: true },
  period: { type: mongoose.Schema.Types.ObjectId, ref: 'Period' },

  wikidataId: String,

  yearsEn: String,
  yearsHe: String,
  locationEn: String,
  locationHe: String,
  famousQuoteEn: String,
  famousQuoteHe: String
});

export default mongoose.model('School', SchoolSchema);
