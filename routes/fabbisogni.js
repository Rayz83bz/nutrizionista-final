// routes/fabbisogni.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // o '../index' se usi quello

// 🔍 Ottieni fabbisogni per paziente tramite join su visite
router.get('/paziente/:id_paziente', async (req, res) => {
  const { id_paziente } = req.params;
  try {
    const rows = await db.all(`
      SELECT f.*
      FROM fabbisogni f
      JOIN visite v ON f.id_visita = v.id
      WHERE v.id_paziente = ?
      ORDER BY f.id DESC
    `, [id_paziente]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Ottieni fabbisogno per visita specifica
router.get('/visita/:id_visita', async (req, res) => {
  try {
    const row = await db.get(
      `SELECT * FROM fabbisogni WHERE id_visita = ?`, [req.params.id_visita]
    );
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Salva nuovo fabbisogno (collegato a visita)
router.post('/', async (req, res) => {
  const f = req.body;

  try {
    const result = await db.run(
      `INSERT INTO fabbisogni (
        id_visita, fabbisogno_calorico, proteine, carboidrati, grassi, note
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [f.id_visita, f.fabbisogno_calorico, f.proteine, f.carboidrati, f.grassi, f.note]
    );
    res.json({ success: true, id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔁 Aggiorna fabbisogno
router.put('/:id', async (req, res) => {
  const f = req.body;
  try {
    await db.run(
      `UPDATE fabbisogni SET
        fabbisogno_calorico = ?, proteine = ?, carboidrati = ?, grassi = ?, note = ?
       WHERE id = ?`,
      [f.fabbisogno_calorico, f.proteine, f.carboidrati, f.grassi, f.note, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Elimina fabbisogno
router.delete('/:id', async (req, res) => {
  try {
    await db.run(`DELETE FROM fabbisogni WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
