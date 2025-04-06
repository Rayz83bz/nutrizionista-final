const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔄 Salva nuova dieta
router.post('/salva', async (req, res) => {
  const { nome_dieta, giorni, id_visita = null } = req.body;

  try {
    if (!id_visita) {
      return res.status(400).json({ error: 'ID visita mancante' });
    }

    const visita = await db.get(`SELECT id FROM visite WHERE id = ?`, [id_visita]);
    if (!visita) return res.status(400).json({ error: 'ID visita non valido' });

    const subResult = await db.get(
      `SELECT MAX(sub_index) as max_sub FROM diete WHERE id_visita = ?`,
      [id_visita]
    );
    const sub_index = subResult?.max_sub !== null ? subResult.max_sub + 1 : 0;
    const now = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO diete (id_visita, nome, sub_index, data_creazione)
       VALUES (?, ?, ?, ?)`,
      [id_visita, nome_dieta, sub_index, now]
    );

    const dietaId = result.lastID;
    if (!dietaId) throw new Error('❌ Inserimento dieta fallito');

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
            [
              pastoId,
              alimento.alimento_id,
              alimento.grammi,
              alimento.note || null
            ]
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Dieta salvata con successo',
      id: dietaId,
      sub_index
    });

  } catch (err) {
    console.error('❌ Errore nel salvataggio dieta:', err);
    res.status(500).json({ success: false, message: 'Errore nel salvataggio dieta' });
  }
});

// 🔍 Recupera tutte le diete di un paziente
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

    res.json(result);
  } catch (err) {
    console.error('Errore nel recupero diete:', err);
    res.status(500).json({ error: 'Errore nel recupero diete' });
  }
});

// 🔍 Recupera una singola dieta per ID
router.get('/dettaglio/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const dieta = await db.get(`
      SELECT 
        d.id, d.nome, d.sub_index, d.data_creazione,
        d.id_visita, v.data AS data_visita,
        v.id_paziente, p.nome AS nome_paziente
      FROM diete d
      JOIN visite v ON d.id_visita = v.id
      JOIN pazienti p ON v.id_paziente = p.id
      WHERE d.id = ?
    `, [id]);

    if (!dieta) return res.status(404).json({ error: 'Dieta non trovata' });

    res.json(dieta);
  } catch (err) {
    console.error('❌ Errore nel recupero dettaglio dieta:', err);
    res.status(500).json({ error: 'Errore server' });
  }
});

// 🔁 Aggiorna dieta esistente
router.put('/:id', async (req, res) => {
  const dietaId = req.params.id;
  const { nome_dieta, giorni, id_visita } = req.body;

  try {
    if (!id_visita) return res.status(400).json({ error: 'ID visita mancante' });

    const visita = await db.get(`SELECT id FROM visite WHERE id = ?`, [id_visita]);
    if (!visita) return res.status(400).json({ error: 'Visita non trovata' });

    const now = new Date().toISOString();

    await db.run(`
      UPDATE diete
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
      const giornoRes = await db.run(`
        INSERT INTO giorni_dieta (id_dieta, giorno_index, note)
        VALUES (?, ?, ?)`,
        [dietaId, giorno.numero_giorno, giorno.note || null]
      );
      const giornoId = giornoRes.lastID;

      for (const pasto of giorno.pasti) {
        const pastoRes = await db.run(`
          INSERT INTO pasti_dieta (id_giorno, tipo_pasto, orario)
          VALUES (?, ?, ?)`,
          [giornoId, pasto.nome_pasto, pasto.orario || null]
        );
        const pastoId = pastoRes.lastID;

        for (const alimento of pasto.alimenti) {
          await db.run(`
            INSERT INTO alimenti_dieta (id_pasto, alimento_id, quantita, note)
            VALUES (?, ?, ?, ?)`,
            [
              pastoId,
              alimento.alimento_id,
              alimento.grammi,
              alimento.note || null
            ]
          );
        }
      }
    }

    res.status(200).json({ success: true, message: 'Dieta aggiornata correttamente' });

  } catch (err) {
    console.error('❌ Errore aggiornamento dieta:', err);
    res.status(500).json({ success: false, message: 'Errore aggiornamento dieta' });
  }
});

// 🔎 Recupera diete per una visita
router.get('/per-visita/:id_visita', async (req, res) => {
  try {
    const diete = await db.all(`SELECT * FROM diete WHERE id_visita = ? ORDER BY sub_index`, [req.params.id_visita]);
    res.json(diete);
  } catch (err) {
    console.error('Errore nel recupero diete per visita:', err);
    res.status(500).json({ error: 'Errore nel recupero diete per visita' });
  }
});

// ❌ Elimina una dieta e tutto ciò che contiene
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const dieta = await db.get(`SELECT * FROM diete WHERE id = ?`, [id]);
    if (!dieta) return res.status(404).json({ error: 'Dieta non trovata' });

    await db.run(`DELETE FROM diete WHERE id = ?`, [id]);

    res.status(200).json({ success: true, message: 'Dieta eliminata con successo' });

  } catch (err) {
    console.error('❌ Errore eliminazione dieta:', err);
    res.status(500).json({ error: 'Errore durante l\'eliminazione della dieta' });
  }
});

module.exports = router;
