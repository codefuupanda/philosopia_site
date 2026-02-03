const mongoose = require('mongoose');

const BeefSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  titleEn: { type: String, required: true }, // Deprecated
  titleHe: { type: String, required: true }, // Deprecated
  title: {
    en: String,
    he: String
  },

  descriptionEn: String, // Deprecated
  descriptionHe: String, // Deprecated
  description: {
    en: String,
    he: String
  },

  philosopherAId: String, // Stable String ID
  philosopherBId: String, // Stable String ID

  // ✅ Fix: Change type to ObjectId to allow proper ".populate()"
  philosopherA: { type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher', required: true },
  philosopherB: { type: mongoose.Schema.Types.ObjectId, ref: 'Philosopher', required: true }
});

module.exports = mongoose.model('Beef', BeefSchema);