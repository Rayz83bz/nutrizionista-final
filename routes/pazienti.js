// 📥 Crea nuovo paziente
// routes/pazienti.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // usa il tuo index.js come db

// 📥 Crea nuovo paziente
router.post('/', async (req, res) => {
  const {
    nome,
    cognome,
    codice_fiscale,
    email,
    telefono,
    altezza
  } = req.body;

  try {
    const result = await db.run(
      `INSERT INTO pazienti (
        nome, cognome, codice_fiscale, email, telefono, altezza
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [nome, cognome, codice_fiscale, email, telefono, altezza]
    );
    res.status(201).json({ id: result.lastID, success: true });
  } catch (err) {
    console.error('❌ Errore salvataggio paziente:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📝 Modifica paziente
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const {
    nome,
    cognome,
    codice_fiscale,
    email,
    telefono,
    altezza
  } = req.body;

  try {
    await db.run(
      `UPDATE pazienti SET
        nome = ?, cognome = ?, codice_fiscale = ?, email = ?, telefono = ?, altezza = ?
      WHERE id = ?`,
      [nome, cognome, codice_fiscale, email, telefono, altezza, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Errore aggiornamento paziente:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📄 Lista pazienti
router.get('/', async (req, res) => {
  try {
    const pazienti = await db.all(`SELECT * FROM pazienti ORDER BY data_creazione DESC`);
    res.json(pazienti);
  } catch (err) {
    console.error('❌ Errore recupero pazienti:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ❌ Elimina paziente
router.delete('/:id', async (req, res) => {
  try {
    await db.run(`DELETE FROM pazienti WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Errore eliminazione paziente:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
// 🔍 Singolo paziente per ID (usato in PazienteForm)
router.get('/:id', async (req, res) => {
  try {
    const row = await db.get(`SELECT * FROM pazienti WHERE id = ?`, [req.params.id]);
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
