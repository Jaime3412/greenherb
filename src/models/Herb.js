const mongoose = require('mongoose');

const HerbSchema = new mongoose.Schema({
  scientificName: { type: String, required: true, trim: true, maxlength: 150 },
  commonName:     { type: String, required: true, trim: true, maxlength: 100 },
  category:       { type: String, required: true, enum: ['Medicinal', 'Culinária', 'Ornamental', 'Aromática'] },
  growthType:     { type: String, enum: ['Rápido', 'Moderado', 'Lento'], default: null },
  description:    { type: String, maxlength: 500, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Herb', HerbSchema);
