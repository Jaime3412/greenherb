const { importHerbsFromRows } = require('../services/herbService');
const { parseCsvBuffer } = require('../services/csvParser');

const importHerbs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Ficheiro CSV é obrigatório' });
    }

    let rows;
    try {
      rows = parseCsvBuffer(req.file.buffer);
    } catch (parseError) {
      return res.status(400).json({ success: false, error: 'Ficheiro CSV inválido ou malformado' });
    }

    const result = await importHerbsFromRows(rows);
    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    if (error.message === 'Ficheiro CSV vazio ou sem linhas válidas') {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

module.exports = { importHerbs };
