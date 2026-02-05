import mongoose from 'mongoose';

const PeriodSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  wikidataId: { type: String, unique: true, sparse: true },
  nameEn: { type: String, required: true },
  nameHe: { type: String, required: true },
  name: {
    en: String,
    he: String
  },

  descriptionHe: String,
  descriptionEn: String,
  description: {
    en: String,
    he: String
  },

  startYear: { type: Number, required: true },
  endYear: { type: Number, required: true }
});

export default mongoose.model('Period', PeriodSchema);
