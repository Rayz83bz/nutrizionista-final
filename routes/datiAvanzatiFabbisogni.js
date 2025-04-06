// /routes/datiAvanzatiFabbisogni.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET storico completo dati + fabbisogni per paziente
router.get('/:id_paziente', (req, res) => {
  const { id_paziente } = req.params;
  const sql = `
    SELECT d.*, f.energia_kcal, f.proteine_g, f.lipidi_g, f.carboidrati_g, f.note as note_fabbisogni
    FROM dati_avanzati_paziente d
    LEFT JOIN fabbisogni f ON f.id_dati_avanzati = d.id
    WHERE d.id_paziente = ?
    ORDER BY d.data DESC
  `;
  db.all(sql, [id_paziente], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST salva dati avanzati + calcolo fabbisogni
router.post('/', (req, res) => {
  const { id_paziente, data, peso, attivita_fisica, glicemia, colesterolo_totale, colesterolo_hdl, colesterolo_ldl, trigliceridi, patologie, preferenze, note } = req.body;

  const sql = `
    INSERT INTO dati_avanzati_paziente (
      id_paziente, data, peso, attivita_fisica, glicemia,
      colesterolo_totale, colesterolo_hdl, colesterolo_ldl, trigliceridi,
      patologie, preferenze, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id_paziente, data, peso, attivita_fisica, glicemia,
    colesterolo_totale, colesterolo_hdl, colesterolo_ldl, trigliceridi,
    JSON.stringify(patologie), JSON.stringify(preferenze), note
  ];

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });

    const datiId = this.lastID;
    const attivitaFattore = {
      'Sedentario': 1.3,
      'Leggero': 1.5,
      'Moderato': 1.7,
      'Intenso': 1.9
    };

    const fabbisogno_calorico = Math.round(peso * 24 * (attivitaFattore[attivita_fisica] || 1.5));
    const proteine = Math.round(peso * 1.2);
    const grassi = Math.round((fabbisogno_calorico * 0.3) / 9);
    const carboidrati = Math.round((fabbisogno_calorico * 0.5) / 4);

    const sqlFabbisogni = `
      INSERT INTO fabbisogni (
        id_paziente, id_dati_avanzati, energia_kcal, proteine_g, lipidi_g, carboidrati_g, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const valuesFabbisogni = [
      id_paziente, datiId, fabbisogno_calorico, proteine, grassi, carboidrati,
      'Calcolo automatico da dati avanzati'
    ];

    db.run(sqlFabbisogni, valuesFabbisogni, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: datiId });
    });
  });
});

module.exports = router;
