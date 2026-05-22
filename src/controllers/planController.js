const { createPlan, getPlans } = require('../services/planService');
const { log } = require('../services/auditService');

const addPlan = async (req, res) => {
  try {
    const plan = await createPlan(req.body, req.user.id);
    await log(req.user.id, 'CREATE_PLAN', 'plans', plan._id);
    return res.status(201).json({ success: true, data: plan });

  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') return res.status(400).json({ success: false, errors: error.errors });
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

const listPlans = async (req, res) => {
  try {
    const plans = await getPlans();
    return res.status(200).json({ success: true, data: plans });
  } catch {
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

module.exports = { addPlan, listPlans };
