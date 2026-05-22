const Plan = require('../models/Plan');
const Herb = require('../models/Herb');
const { validatePlan } = require('../validators/planValidator');

const createPlan = async (data, userId) => {
  const { isValid, errors } = validatePlan(data);
  if (!isValid) {
    const err = new Error('Validação falhou');
    err.code = 'VALIDATION_ERROR';
    err.errors = errors;
    throw err;
  }

  const herb = await Herb.findById(data.herbId);
  if (!herb) {
    const err = new Error('Erva aromática não encontrada');
    err.code = 'NOT_FOUND';
    throw err;
  }

  return Plan.create({ ...data, createdBy: userId });
};

const getPlans = async () =>
  Plan.find()
    .populate('herbId', 'commonName scientificName')
    .populate('createdBy', 'name role');

const getPlanById = async (id) => Plan.findById(id);

module.exports = { createPlan, getPlans, getPlanById };
