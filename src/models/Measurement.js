const mongoose = require('mongoose');

const MeasurementSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  temperature: { type: Number, required: true },
  humidity:    { type: Number, required: true },
  luminosity:  { type: Number, required: true },
  sensorOK:    { type: Boolean, default: true },
  timestamp:   { type: Date,    default: Date.now },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Measurement', MeasurementSchema);
