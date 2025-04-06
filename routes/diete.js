const express = require('express');
const router = express.Router();
const db = require('../db');

// 🔄 Salva nuova dieta
router.post('/salva', async (req, res) => {
  const { nome_dieta, fabbisogni, giorni, id_visita = null } = req.body;

  try {
    if (!id_visita) {
      return res.status(400).json({ error: 'ID visita mancante' });
    }

    // Verifica esistenza visita
    const visita = await db.get(`SELECT id FROM visite WHERE id = ?`, [id_visita]);
    if (!visita) {
      return res.status(400).json({ error: 'ID visita non valido' });
    }

    // Calcolo sub_index automatico per quella visita
    const subResult = await db.get(
      `SELECT MAX(sub_index) as max_sub FROM diete WHERE id_visita = ?`,
      [id_visita]
    );
    const sub_index = subResult?.max_sub !== null ? subResult.max_sub + 1 : 0;

    const now = new Date().toISOString();
    const jsonData = JSON.stringify(req.body);

    const result = await db.run(
      `INSERT INTO diete (id_visita, nome, sub_index, data_creazione)
       VALUES (?, ?, ?, ?)`,
      [id_visita, nome_dieta, sub_index, now]
    );

    const dietaId = result.lastID;
    if (!dietaId) throw new Error('❌ Inserimento dieta fallito');

    // Inserisci fabbisogni se presenti
    if (fabbisogni) {
      await db.run(
        `INSERT INTO fabbisogni_dieta (dieta_id, fabbisogno_calorico, proteine, grassi, carboidrati)
         VALUES (?, ?, ?, ?, ?)`,
        [dietaId, fabbisogni.fabbisogno_calorico, fabbisogni.proteine, fabbisogni.grassi, fabbisogni.carboidrati]
      );
    }

    // Inserisci giorni, pasti e alimenti
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

// 📄 Ottieni tutte le diete di un paziente (via visita)
router.get('/:id_paziente', async (req, res) => {
  try {
    const result = await db.all(`
      SELECT 
        d.id,
        d.nome,
        d.sub_index,
        d.data_creazione,
        d.id_visita,
        v.data AS data_visita
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
        d.id,
        d.nome,
        d.sub_index,
        d.data_creazione,
        d.id_visita,
        v.data AS data_visita,
        v.id_paziente,
        p.nome AS nome_paziente
      FROM diete d
      JOIN visite v ON d.id_visita = v.id
      JOIN pazienti p ON v.id_paziente = p.id
      WHERE d.id = ?
    `, [id]);

    if (!dieta) {
      return res.status(404).json({ error: 'Dieta non trovata' });
    }

    res.json(dieta);
  } catch (err) {
    console.error('❌ Errore nel recupero dettaglio dieta:', err);
    res.status(500).json({ error: 'Errore server' });
  }
});


// 🔁 Aggiorna dieta esistente
router.put('/:id', async (req, res) => {
  const dietaId = req.params.id;
  const { nome_dieta, fabbisogni, giorni, id_visita } = req.body;

  try {
    if (!id_visita) {
      return res.status(400).json({ error: 'ID visita mancante' });
    }

    const visita = await db.get(`SELECT id FROM visite WHERE id = ?`, [id_visita]);
    if (!visita) {
      return res.status(400).json({ error: 'Visita non trovata' });
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE diete
       SET nome = ?, data_creazione = ?, id_visita = ?
       WHERE id = ?`,
      [nome_dieta, now, id_visita, dietaId]
    );

    // Pulisci giorni → pasti → alimenti
    const giorniExist = await db.all(`SELECT id FROM giorni_dieta WHERE id_dieta = ?`, [dietaId]);

    for (const g of giorniExist) {
      const pastiExist = await db.all(`SELECT id FROM pasti_dieta WHERE id_giorno = ?`, [g.id]);
      for (const p of pastiExist) {
        await db.run(`DELETE FROM alimenti_dieta WHERE id_pasto = ?`, [p.id]);
      }
      await db.run(`DELETE FROM pasti_dieta WHERE id_giorno = ?`, [g.id]);
    }

    await db.run(`DELETE FROM giorni_dieta WHERE id_dieta = ?`, [dietaId]);
    await db.run(`DELETE FROM fabbisogni_dieta WHERE dieta_id = ?`, [dietaId]);

    // Re-inserisci fabbisogni
    if (fabbisogni) {
      await db.run(
        `INSERT INTO fabbisogni_dieta (dieta_id, fabbisogno_calorico, proteine, grassi, carboidrati)
         VALUES (?, ?, ?, ?, ?)`,
        [dietaId, fabbisogni.fabbisogno_calorico, fabbisogni.proteine, fabbisogni.grassi, fabbisogni.carboidrati]
      );
    }

    // Re-inserisci giorni, pasti e alimenti
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

    res.status(200).json({ success: true, message: 'Dieta aggiornata correttamente' });

  } catch (err) {
    console.error('❌ Errore aggiornamento dieta:', err);
    res.status(500).json({ success: false, message: 'Errore aggiornamento dieta' });
  }
});

// 🔄 Calcola i fabbisogni per una dieta
router.post('/fabbisogni/calcola/:dietaId', async (req, res) => {
  const dietaId = req.params.dietaId;

  try {
    const dieta = await db.get(`SELECT id_visita FROM diete WHERE id = ?`, [dietaId]);
    if (!dieta) return res.status(404).json({ error: 'Dieta non trovata' });

    const visita = await db.get(`SELECT * FROM visite WHERE id = ?`, [dieta.id_visita]);
    if (!visita) return res.status(404).json({ error: 'Visita non trovata' });

    const paziente = await db.get(`SELECT * FROM pazienti WHERE id = ?`, [visita.id_paziente]);
    if (!paziente) return res.status(404).json({ error: 'Paziente non trovato' });

    const { peso, altezza, sesso, data_nascita, attivita_fisica } = paziente;
    const eta = Math.floor((new Date() - new Date(data_nascita)) / (365.25 * 24 * 60 * 60 * 1000));
    const isMale = sesso?.toLowerCase() === 'm' || sesso?.toLowerCase() === 'maschio';

    const bmr = isMale
      ? (10 * peso) + (6.25 * altezza) - (5 * eta) + 5
      : (10 * peso) + (6.25 * altezza) - (5 * eta) - 161;

    const livelli = { basso: 1.3, medio: 1.5, alto: 1.75, atleta: 2.0 };
    const fattore = livelli[attivita_fisica?.toLowerCase()] || 1.5;
    const fabbisogno_calorico = Math.round(bmr * fattore);

    const proteine = +(fabbisogno_calorico * 0.18 / 4).toFixed(1);
    const grassi = +(fabbisogno_calorico * 0.28 / 9).toFixed(1);
    const carboidrati = +(fabbisogno_calorico * 0.54 / 4).toFixed(1);

    await db.run(
      `INSERT OR REPLACE INTO fabbisogni_dieta (dieta_id, fabbisogno_calorico, proteine, grassi, carboidrati)
       VALUES (?, ?, ?, ?, ?)`,
      [dietaId, fabbisogno_calorico, proteine, grassi, carboidrati]
    );

    res.json({ dieta_id: dietaId, fabbisogno_calorico, proteine, grassi, carboidrati });
  } catch (err) {
    console.error('Errore calcolo fabbisogni dieta:', err);
    res.status(500).json({ error: 'Errore durante il calcolo fabbisogni' });
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
    if (!dieta) {
      return res.status(404).json({ error: 'Dieta non trovata' });
    }

    const giorni = await db.all(`SELECT id FROM giorni_dieta WHERE id_dieta = ?`, [id]);

    for (const g of giorni) {
      const pasti = await db.all(`SELECT id FROM pasti_dieta WHERE id_giorno = ?`, [g.id]);
      for (const p of pasti) {
        await db.run(`DELETE FROM alimenti_dieta WHERE id_pasto = ?`, [p.id]);
      }
      await db.run(`DELETE FROM pasti_dieta WHERE id_giorno = ?`, [g.id]);
    }

    await db.run(`DELETE FROM giorni_dieta WHERE id_dieta = ?`, [id]);
    await db.run(`DELETE FROM fabbisogni_dieta WHERE dieta_id = ?`, [id]);
    await db.run(`DELETE FROM diete WHERE id = ?`, [id]);

    res.status(200).json({ success: true, message: 'Dieta eliminata con successo' });

  } catch (err) {
    console.error('❌ Errore eliminazione dieta:', err);
    res.status(500).json({ error: 'Errore durante l\'eliminazione della dieta' });
  }
});



module.exports = router;