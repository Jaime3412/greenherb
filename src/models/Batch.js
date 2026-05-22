const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  herbId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Herb',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  status: {
    type: String,
    enum: ['ativo', 'concluído', 'comprometido'],
    default: 'ativo'
  },
  startDate:    { type: Date,   default: Date.now },
  endDate:      { type: Date,   default: null },
  losses:       { type: Number, default: 0 },       // percentagem de perdas 0-100
  productivity: { type: Number, default: null },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Batch', BatchSchema);
