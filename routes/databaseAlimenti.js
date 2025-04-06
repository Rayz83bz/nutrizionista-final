// /backend/routes/databaseAlimenti.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    let sql = `
      SELECT
        id,
        "Nome" AS nome,
        "Categoria" AS categoria,
        "Unità di riferimento" AS unita_riferimento,
        "Energia, kilojoules (kJ)" AS energia_kj,
        "Energia, calorie (kcal)" AS energia_kcal,
        "Lipidi, totali (g)" AS lipidi_totali,
        "Acidi grassi, saturi (g)" AS grassi_saturi,
        "Acidi grassi, monoinsaturi (g)" AS grassi_monoinsaturi,
        "Acidi grassi, polinsaturi (g)" AS grassi_polinsaturi,
        "Colesterolo (mg)" AS colesterolo,
        "Glucidi, disponibili (g)" AS carboidrati,
        "Zuccheri (g)" AS zuccheri,
        "Amido (g)" AS amido,
        "Fibra alimentare (g)" AS fibra_alimentare,
        "Proteine (g)" AS proteine,
        "Sale (NaCl) (g)" AS sale,
        "Alcool (g)" AS alcool,
        "Acqua (g)" AS acqua,
        "Attività di vitamina A, RE (µg-RE)" AS vitamina_a_re,
        "Attività di vitamina A, RAE (µg-RE)" AS vitamina_a_rae,
        "Retinolo (µg)" AS retinolo,
        "Attività di beta-carotene (µg-BCE)" AS attivita_beta_carotene,
        "Beta-carotene (µg)" AS beta_carotene,
        "Vitamina B1 (tiamina) (mg)" AS vitamina_b1,
        "Vitamina B2 (riboflavina) (mg)" AS vitamina_b2,
        "Vitamina B6 (piridossina) (mg)" AS vitamina_b6,
        "Vitamina B12 (cobalamina) (µg)" AS vitamina_b12,
        "Niacina (mg)" AS niacina,
        "Folati (µg)" AS folati,
        "Acido pantotenico (mg)" AS acido_pantotenico,
        "Vitamina C (acido ascorbico) (mg)" AS vitamina_c,
        "Vitamina D (calciferolo) (µg)" AS vitamina_d,
        "Potassio (K) (mg)" AS potassio,
        "Sodio (Na) (mg)" AS sodio,
        "Cloro (Cl) (mg)" AS cloro,
        "Calcio (Ca) (mg)" AS calcio,
        "Magnesio (Mg) (mg)" AS magnesio,
        "Fosforo (P) (mg)" AS fosforo,
        "Ferro (Fe) (mg)" AS ferro,
        "Iodio (I) (µg)" AS iodio,
        "Zinco (Zn)  (mg)" AS zinco,
        "Selenio (Se) (µg)" AS selenio
      FROM alimenti
    `;

    const params = [];
    if (req.query.search) {
      sql += ' WHERE "Nome" LIKE ?';
      params.push(`%${req.query.search}%`);
    }

    const rows = await db.all(sql, params);
    console.log(`✅ ${rows.length} alimenti letti dal DB`);
    res.json(rows);
  } catch (err) {
    console.error('❌ Errore durante la lettura degli alimenti:', err);
    res.status(500).send('Errore server: ' + err.message);
  }
});


router.get('/ultimo-id', (req, res) => {
  const sql = 'SELECT MAX(id) AS ultimoId FROM alimenti';
  db.get(sql, [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ultimoId: row.ultimoId || 0 });
  });
});


module.exports = router;
