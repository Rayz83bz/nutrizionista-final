// routes/progressi.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET progressi per un paziente
router.get('/:pazienteId', (req, res) => {
  const { pazienteId } = req.params;
  const sql = 'SELECT * FROM progressi WHERE paziente_id = ? ORDER BY data_misurazione ASC';
  db.all(sql, [pazienteId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST inserisci un nuovo progresso
router.post('/', (req, res) => {
  const { paziente_id, data_misurazione, peso, massa_grassa, note } = req.body;
  const sql = `
    INSERT INTO progressi (paziente_id, data_misurazione, peso, massa_grassa, note)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(sql, [paziente_id, data_misurazione, peso, massa_grassa, note], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Progresso registrato' });
  });
});

module.exports = router;
