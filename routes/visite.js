// routes/visite.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // o '../index' se è lì

// 🔍 Tutte le visite di un paziente
router.get('/paziente/:id_paziente', async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT * FROM visite WHERE id_paziente = ? ORDER BY data DESC`,
      [req.params.id_paziente]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Ultima visita per paziente
router.get('/ultima/:id_paziente', async (req, res) => {
  try {
    const row = await db.get(
      `SELECT * FROM visite WHERE id_paziente = ? ORDER BY data DESC LIMIT 1`,
      [req.params.id_paziente]
    );
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Singola visita per ID
router.get('/:id', async (req, res) => {
  try {
    const row = await db.get(`SELECT * FROM visite WHERE id = ?`, [req.params.id]);
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Crea nuova visita
router.post('/', async (req, res) => {
  const v = req.body;
  try {
    const result = await db.run(
      `INSERT INTO visite (
        id_paziente, data, peso, attivita_fisica, note
      ) VALUES (?, ?, ?, ?, ?)`,
      [v.id_paziente, v.data, v.peso, v.attivita_fisica, v.note]
    );
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔁 Modifica visita
router.put('/:id', async (req, res) => {
  const v = req.body;
  try {
    await db.run(
      `UPDATE visite SET
        id_paziente = ?, data = ?, peso = ?, attivita_fisica = ?, note = ?
       WHERE id = ?`,
      [v.id_paziente, v.data, v.peso, v.attivita_fisica, v.note, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Elimina visita (con controllo di diete collegate)
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const count = await db.get(`SELECT COUNT(*) as total FROM diete WHERE id_visita = ?`, [id]);
    if (count?.total > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VISITA_CON_DIETE',
          message: 'Impossibile eliminare: la visita ha diete collegate.'
        }
      });
    }

    await db.run(`DELETE FROM visite WHERE id = ?`, [id]);
    res.json({ success: true });

  } catch (err) {
    console.error('❌ Errore eliminazione visita:', err);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});


module.exports = router;
