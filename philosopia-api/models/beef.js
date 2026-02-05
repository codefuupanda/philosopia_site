import mongoose from 'mongoose';

const BeefSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  titleEn: { type: String, required: true },
  titleHe: { type: String, required: true },
  title: {
    en: String,
    he: String
  },

  descriptionEn: String,
  descriptionHe: String,
  description: {
    en: String,
    he: String
  },

  philosopherAId: String,
  philosopherBId: String,

  philosopherA: { type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher', required: true },
  philosopherB: { type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher', required: true }
});

export default mongoose.model('Beef', BeefSchema);
