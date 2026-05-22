const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['regular', 'emergencia', 'pontual'],
    required: true
  },
  herbId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Herb',
    required: true
  },
  minTemperature: { type: Number, required: true },
  maxTemperature: { type: Number, required: true },
  minHumidity:    { type: Number, required: true },
  maxHumidity:    { type: Number, required: true },
  minLuminosity:  { type: Number, required: true },
  maxLuminosity:  { type: Number, required: true },
  durationDays:   { type: Number, required: true },
  responsibleAuth: { type: String, default: null },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Plan', PlanSchema);
