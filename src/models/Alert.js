const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  measurementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Measurement',
    required: true
  },
  type: {
    type: String,
    enum: ['Informativo', 'Aviso', 'Crítico'],
    required: true
  },
  status: {
    type: String,
    enum: ['pendente', 'resolvido', 'ignorado'],
    default: 'pendente'
  },
  justification: { type: String, default: null },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
