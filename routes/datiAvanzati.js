const express = require('express');
const router = express.Router();
const db = require('../db');

// 📦 Utilità per estrarre campi appartenenti a ciascuna tabella
const campiClinici = [
  "glicemia", "colesterolo", "colesteroloHDL", "colesteroloLDL", "trigliceridi",
  "emoglobina", "ematocrito", "ferritina", "vcm", "piastrine", "eritrociti",
  "leucociti", "vitaminaD", "vitaminaB12", "tsh"
];

const campiAntropometrici = [
  "circonferenza_vita", "circonferenza_fianchi", "circonferenza_torace",
  "circonferenza_polso_dx", "circonferenza_polso_sx", "braccio_dx", "braccio_sx",
  "avambraccio_dx", "avambraccio_sx", "massa_grassa", "grasso_sottocutaneo",
  "grasso_viscerale", "costituzione", "biotipo"
];

// 🔄 CREA o AGGIORNA una visita (visite + clinici + antropometrici)
router.post('/', async (req, res) => {
  const dati = req.body;
  const { id, ...rest } = dati;

  const baseVisita = {
    id_paziente: dati.id_paziente,
    data: dati.data,
    peso: dati.peso,
    attivita_fisica: dati.attivita_fisica,
    note: dati.note || null
  };

  const valoriClinici = {};
  const valoriAntropo = {};

  for (const k of campiClinici) if (dati[k] !== undefined) valoriClinici[k] = dati[k];
  for (const k of campiAntropometrici) if (dati[k] !== undefined) valoriAntropo[k] = dati[k];

  try {
    if (id) {
      // UPDATE
      await db.run(`UPDATE visite SET data = ?, peso = ?, attivita_fisica = ?, note = ? WHERE id = ?`, [
        baseVisita.data, baseVisita.peso, baseVisita.attivita_fisica, baseVisita.note, id
      ]);
      await db.run(`UPDATE parametri_clinici SET ${Object.keys(valoriClinici).map(k => `${k} = ?`).join(', ')} WHERE id_visita = ?`, [
        ...Object.values(valoriClinici), id
      ]);
      await db.run(`UPDATE parametri_antropometrici SET ${Object.keys(valoriAntropo).map(k => `${k} = ?`).join(', ')} WHERE id_visita = ?`, [
        ...Object.values(valoriAntropo), id
      ]);
      res.json({ success: true, message: "Visita aggiornata", id });
    } else {
      // INSERT visita → poi clinici/antropo
      const result = await db.run(
        `INSERT INTO visite (id_paziente, data, peso, attivita_fisica, note) VALUES (?, ?, ?, ?, ?)`,
        [baseVisita.id_paziente, baseVisita.data, baseVisita.peso, baseVisita.attivita_fisica, baseVisita.note]
      );
      const newId = result.lastID;

      await db.run(
        `INSERT INTO parametri_clinici (id_visita, ${Object.keys(valoriClinici).join(', ')}) VALUES (?, ${Object.keys(valoriClinici).map(() => '?').join(', ')})`,
        [newId, ...Object.values(valoriClinici)]
      );
      await db.run(
        `INSERT INTO parametri_antropometrici (id_visita, ${Object.keys(valoriAntropo).join(', ')}) VALUES (?, ${Object.keys(valoriAntropo).map(() => '?').join(', ')})`,
        [newId, ...Object.values(valoriAntropo)]
      );

      res.json({ success: true, message: "Visita salvata", id: newId });
    }
  } catch (err) {
    console.error("❌ Errore salvataggio visita:", err);
    res.status(500).json({ success: false, message: 'Errore salvataggio visita' });
  }
});

// 🔍 GET tutte le visite (con JOIN dei parametri)
router.get('/:id_paziente', async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT v.*, c.*, a.*
      FROM visite v
      LEFT JOIN parametri_clinici c ON v.id = c.id_visita
      LEFT JOIN parametri_antropometrici a ON v.id = a.id_visita
      WHERE v.id_paziente = ?
      ORDER BY v.data DESC
    `, [req.params.id_paziente]);
    res.json(rows);
  } catch (err) {
    console.error('Errore recupero visite:', err);
    res.status(500).json({ error: 'Errore recupero visite' });
  }
});

// ❌ DELETE visita
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.run(`DELETE FROM parametri_clinici WHERE id_visita = ?`, [id]);
    await db.run(`DELETE FROM parametri_antropometrici WHERE id_visita = ?`, [id]);
    await db.run(`DELETE FROM visite WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Errore eliminazione visita:', err);
    res.status(500).json({ error: 'Errore eliminazione visita' });
  }
});

module.exports = router;
