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
  const { nome_dieta, giorni, id_visita, paziente_id } = req.body;

  if (!paziente_id) {
    return res.status(400).json({ success: false, error: "ID paziente mancante" });
  }

  const idVisitaFinale = (!id_visita || isNaN(id_visita)) ? null : id_visita;

  try {
    await db.run('BEGIN TRANSACTION');

    const subResult = await db.get(`SELECT MAX(sub_index) as max_sub FROM diete WHERE paziente_id = ?`, [paziente_id]);
    const sub_index = subResult?.max_sub !== null ? subResult.max_sub + 1 : 0;
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO diete (paziente_id, id_visita, nome, sub_index, data_creazione)
       VALUES (?, ?, ?, ?, ?)`,
      [paziente_id, idVisitaFinale, nome_dieta, sub_index, now]
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
  const idVisitaFinale = (!id_visita || isNaN(id_visita)) ? null : id_visita;

  try {
    await db.run('BEGIN TRANSACTION');

    const now = new Date().toISOString();

    await db.run(
      `UPDATE diete
       SET nome = ?, data_creazione = ?, id_visita = ?
       WHERE id = ?`,
      [nome_dieta, now, idVisitaFinale, dietaId]
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
  const dietaId = req.params.id;

  try {
    const giorni = await db.all(`SELECT id FROM giorni_dieta WHERE id_dieta = ?`, [dietaId]);

    for (const giorno of giorni) {
      const pasti = await db.all(`SELECT id FROM pasti_dieta WHERE id_giorno = ?`, [giorno.id]);

      for (const pasto of pasti) {
        await db.run(`DELETE FROM alimenti_dieta WHERE id_pasto = ?`, [pasto.id]);
      }

      await db.run(`DELETE FROM pasti_dieta WHERE id_giorno = ?`, [giorno.id]);
    }

    await db.run(`DELETE FROM giorni_dieta WHERE id_dieta = ?`, [dietaId]);
    await db.run(`DELETE FROM diete WHERE id = ?`, [dietaId]);

    res.json({ success: true, message: 'Dieta e contenuti eliminati con successo' });
  } catch (error) {
    console.error('Errore eliminazione dieta:', error.message);
    res.status(500).json({ success: false, error: 'Errore interno durante l\'eliminazione' });
  }
});

// 🔍 Recupera una dieta con giorni, pasti, alimenti
router.get('/dettaglio/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const dieta = await db.get(`
      SELECT d.*, v.id_paziente
      FROM diete d
      LEFT JOIN visite v ON d.id_visita = v.id
      WHERE d.id = ?
    `, [id]);

    if (!dieta) return res.status(404).json({ error: 'Dieta non trovata' });

    const giorni = await db.all(`SELECT * FROM giorni_dieta WHERE id_dieta = ?`, [id]);

    for (const g of giorni) {
      g.pasti = await db.all(`SELECT * FROM pasti_dieta WHERE id_giorno = ?`, [g.id]);

      for (const p of g.pasti) {
        p.alimenti = await db.all(`SELECT * FROM alimenti_dieta WHERE id_pasto = ?`, [p.id]);
      }
    }

    res.json({
      success: true,
      data: {
        ...dieta,
        giorni
      }
    });

  } catch (err) {
    console.error('❌ Errore nel dettaglio dieta:', err);
    res.status(500).json({ error: 'Errore nel caricamento dieta' });
  }
});

// 📄 Tutte le diete di un paziente
router.get('/:id_paziente', async (req, res) => {
  const { id_paziente } = req.params;
  try {
    const sql = `
      SELECT d.*
      FROM diete d
      LEFT JOIN visite v ON d.id_visita = v.id
      WHERE d.paziente_id = ?
      ORDER BY d.data_creazione DESC
    `;
    const result = await db.all(sql, [id_paziente]);
    res.json({ success: true, diete: result });
  } catch (err) {
    console.error('Errore get diete:', err);
    res.status(500).json({ success: false, error: 'Errore nel recupero delle diete' });
  }
});

// 🔗 Collega dieta a visita (PUT)
router.put('/:id/collega-visita', async (req, res) => {
  const { id } = req.params;
  const { id_visita } = req.body;

  if (!id_visita) {
    return res.status(400).json({ success: false, error: 'id_visita mancante' });
  }

  try {
    const result = await db.run(
      `UPDATE diete SET id_visita = ? WHERE id = ?`,
      [id_visita, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Dieta non trovata' });
    }

    res.json({ success: true, message: 'Visita collegata correttamente' });
  } catch (err) {
    console.error('Errore nel collegamento visita:', err.message);
    res.status(500).json({ success: false, error: 'Errore interno server' });
  }
});

// 🔍 Singola dieta con dati visita
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const dieta = await db.get(`
      SELECT 
        d.id, 
        d.nome, 
        d.paziente_id,
        d.sub_index,
        d.data_creazione,
        d.id_visita,
        v.data AS visita_data
      FROM diete d
      LEFT JOIN visite v ON d.id_visita = v.id
      WHERE d.id = ?
    `, [id]);

    if (!dieta) {
      return res.status(404).json({ success: false, error: 'Dieta non trovata' });
    }

    res.json({ success: true, data: dieta });
  } catch (err) {
    console.error('Errore nel recupero dieta:', err.message);
    res.status(500).json({ success: false, error: 'Errore interno server' });
  }
});

// 🔍 Tutte le diete
router.get('/', async (req, res) => {
  try {
    const diete = await db.all(`
      SELECT 
        d.id,
        d.nome,
        d.paziente_id,
        p.nome AS nome_paziente,
        p.cognome AS cognome_paziente,
        d.sub_index,
        d.data_creazione,
        d.id_visita,
        v.data AS visita_data
      FROM diete d
      LEFT JOIN pazienti p ON d.paziente_id = p.id
      LEFT JOIN visite v ON d.id_visita = v.id
      ORDER BY d.data_creazione DESC
    `);

    res.json({ success: true, data: diete });
  } catch (err) {
    console.error('Errore nel recupero lista diete:', err.message);
    res.status(500).json({ success: false, error: 'Errore interno server' });
  }
});

module.exports = router;
