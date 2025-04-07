const express = require('express');
const router = express.Router();
const db = require('../db');

// 🛡️ Middleware di validazione dieta
function validateDieta(req, res, next) {
  const { nome_dieta, giorni } = req.body;

  if (!nome_dieta?.trim()) {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Nome dieta obbligatorio" } });
  }

  if (!Array.isArray(giorni) || giorni.length === 0) {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Devi inserire almeno un giorno" } });
  }

  for (const giorno of giorni) {
    if (!Array.isArray(giorno.pasti) || giorno.pasti.length === 0) {
      return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Ogni giorno deve avere almeno un pasto" } });
    }

    for (const pasto of giorno.pasti) {
      if (!Array.isArray(pasto.alimenti)) continue;
      for (const alimento of pasto.alimenti) {
        if (!alimento.alimento_id || alimento.grammi <= 0) {
          return res.status(400).json({ success: false, error: { code: "INVALID_GRAMMI", message: "Ogni alimento deve avere quantità > 0" } });
        }
      }
    }
  }

  next();
}

// 🔄 Salva nuova dieta
router.post('/salva', validateDieta, async (req, res) => {
  const { nome_dieta, giorni, id_visita } = req.body;

  if (!id_visita || isNaN(id_visita)) {
    return res.status(400).json({ success: false, error: { code: "INVALID_VISITA", message: "ID visita non valido" } });
  }

  try {
    await db.run('BEGIN TRANSACTION');

    const subResult = await db.get(`SELECT MAX(sub_index) as max_sub FROM diete WHERE id_visita = ?`, [id_visita]);
    const sub_index = subResult?.max_sub !== null ? subResult.max_sub + 1 : 0;
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO diete (id_visita, nome, sub_index, data_creazione)
       VALUES (?, ?, ?, ?)`,
      [id_visita, nome_dieta, sub_index, now]
    );

    const dietaId = result.lastID;

    for (const giorno of giorni) {
      const giornoRes = await db.run(
        `INSERT INTO giorni_dieta (id_dieta, giorno_index, note)
         VALUES (?, ?, ?)`,
        [dietaId, giorno.numero_giorno, giorno.note || null]
      );
      const giornoId = giornoRes.lastID;

      for (const pasto of giorno.pasti) {
        const pastoRes = await db.run(
          `INSERT INTO pasti_dieta (id_giorno, tipo_pasto, orario)
           VALUES (?, ?, ?)`,
          [giornoId, pasto.nome_pasto, pasto.orario || null]
        );
        const pastoId = pastoRes.lastID;

        for (const alimento of pasto.alimenti) {
          await db.run(
            `INSERT INTO alimenti_dieta (id_pasto, alimento_id, quantita, note)
             VALUES (?, ?, ?, ?)`,
            [pastoId, alimento.alimento_id, alimento.grammi, alimento.note || null]
          );
        }
      }
    }

    await db.run('COMMIT');
    res.status(200).json({ success: true, id: dietaId, sub_index });

  } catch (err) {
    await db.run('ROLLBACK');
    console.error('❌ Errore salvataggio dieta:', err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Errore salvataggio dieta" } });
  }
});

// 🔁 Aggiorna dieta
router.put('/:id', validateDieta, async (req, res) => {
  const dietaId = req.params.id;
  const { nome_dieta, giorni, id_visita } = req.body;

  if (!id_visita || isNaN(id_visita)) {
    return res.status(400).json({ success: false, error: { code: "INVALID_VISITA", message: "ID visita non valido" } });
  }

  try {
    await db.run('BEGIN TRANSACTION');

    const now = new Date().toISOString();

    await db.run(
      `UPDATE diete
       SET nome = ?, data_creazione = ?, id_visita = ?
       WHERE id = ?`,
      [nome_dieta, now, id_visita, dietaId]
    );

    const giorniExist = await db.all(`SELECT id FROM giorni_dieta WHERE id_dieta = ?`, [dietaId]);
    for (const g of giorniExist) {
      const pastiExist = await db.all(`SELECT id FROM pasti_dieta WHERE id_giorno = ?`, [g.id]);
      for (const p of pastiExist) {
        await db.run(`DELETE FROM alimenti_dieta WHERE id_pasto = ?`, [p.id]);
      }
      await db.run(`DELETE FROM pasti_dieta WHERE id_giorno = ?`, [g.id]);
    }
    await db.run(`DELETE FROM giorni_dieta WHERE id_dieta = ?`, [dietaId]);

    for (const giorno of giorni) {
      const giornoRes = await db.run(
        `INSERT INTO giorni_dieta (id_dieta, giorno_index, note)
         VALUES (?, ?, ?)`,
        [dietaId, giorno.numero_giorno, giorno.note || null]
      );
      const giornoId = giornoRes.lastID;

      for (const pasto of giorno.pasti) {
        const pastoRes = await db.run(
          `INSERT INTO pasti_dieta (id_giorno, tipo_pasto, orario)
           VALUES (?, ?, ?)`,
          [giornoId, pasto.nome_pasto, pasto.orario || null]
        );
        const pastoId = pastoRes.lastID;

        for (const alimento of pasto.alimenti) {
          await db.run(
            `INSERT INTO alimenti_dieta (id_pasto, alimento_id, quantita, note)
             VALUES (?, ?, ?, ?)`,
            [pastoId, alimento.alimento_id, alimento.grammi, alimento.note || null]
          );
        }
      }
    }

    await db.run('COMMIT');
    res.status(200).json({ success: true, message: "Dieta aggiornata con successo" });

  } catch (err) {
    await db.run('ROLLBACK');
    console.error('❌ Errore aggiornamento dieta:', err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Errore aggiornamento dieta" } });
  }
});

// ❌ Elimina dieta
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const exists = await db.get(`SELECT id FROM diete WHERE id = ?`, [id]);
    if (!exists) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Dieta non trovata" } });
    }

    await db.run(`DELETE FROM diete WHERE id = ?`, [id]);
    res.status(200).json({ success: true, message: "Dieta eliminata" });
  } catch (err) {
    console.error("Errore eliminazione dieta:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Errore eliminazione dieta" } });
  }
});

// 🔍 Recupera una singola dieta completa (giorni → pasti → alimenti)
router.get('/dettaglio/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const dieta = await db.get(`SELECT * FROM diete WHERE id = ?`, [id]);
    if (!dieta) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Dieta non trovata" } });

    const raw = await db.all(`
      SELECT 
        g.id AS giorno_id, g.giorno_index, g.note AS note_giorno,
        p.id AS pasto_id, p.tipo_pasto, p.orario,
        a.id AS alimento_id, a.alimento_id AS alimento_ref, a.quantita, a.note AS note_alimento
      FROM giorni_dieta g
      LEFT JOIN pasti_dieta p ON g.id = p.id_giorno
      LEFT JOIN alimenti_dieta a ON p.id = a.id_pasto
      WHERE g.id_dieta = ?
      ORDER BY g.giorno_index, p.orario`, [id]);

    const giorniMap = {};

    for (const row of raw) {
      if (!giorniMap[row.giorno_id]) {
        giorniMap[row.giorno_id] = {
          numero_giorno: row.giorno_index,
          note: row.note_giorno,
          pasti: []
        };
      }

      if (row.pasto_id) {
        let pasto = giorniMap[row.giorno_id].pasti.find(p => p.pasto_id === row.pasto_id);
        if (!pasto) {
          pasto = {
            pasto_id: row.pasto_id,
            nome_pasto: row.tipo_pasto,
            orario: row.orario,
            alimenti: []
          };
          giorniMap[row.giorno_id].pasti.push(pasto);
        }

        if (row.alimento_id) {
          pasto.alimenti.push({
            id: row.alimento_id,
            alimento_id: row.alimento_ref,
            grammi: row.quantita,
            note: row.note_alimento
          });
        }
      }
    }

    dieta.giorni = Object.values(giorniMap);
    res.json({ success: true, data: dieta });

  } catch (err) {
    console.error("Errore recupero dettaglio dieta:", err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Errore dettaglio dieta" } });
  }
});

// 📄 Tutte le diete di un paziente
router.get('/:id_paziente', async (req, res) => {
  try {
    const result = await db.all(`
      SELECT 
        d.id, d.nome, d.sub_index, d.data_creazione,
        d.id_visita, v.data AS data_visita
      FROM diete d
      JOIN visite v ON d.id_visita = v.id
      WHERE v.id_paziente = ?
      ORDER BY v.data DESC, d.sub_index ASC
    `, [req.params.id_paziente]);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Errore recupero diete:', err);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Errore recupero diete" } });
  }
});

module.exports = router;
