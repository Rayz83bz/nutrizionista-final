// routes/piani.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST crea un nuovo piano
router.post('/nuovo', (req, res) => {
  const { paziente_id, nome, descrizione, data_inizio, data_fine } = req.body;
  const finalDate = data_fine || (() => {
    const d = new Date(data_inizio);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  })();

  const sql = `
    INSERT INTO piani (paziente_id, nome, descrizione, data_inizio, data_fine)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(sql, [paziente_id, nome, descrizione, data_inizio, finalDate], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// GET tutti i piani
router.get('/', (req, res) => {
  const sql = `
    SELECT p.id, p.nome, p.descrizione, p.data_inizio, p.data_fine,
           pa.nome AS paziente_nome, pa.cognome AS paziente_cognome
    FROM piani p
    LEFT JOIN pazienti pa ON pa.id = p.paziente_id
    ORDER BY p.data_inizio DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// DELETE elimina un piano
router.delete('/:id', (req, res) => {
  const pianoId = req.params.id;
  db.run('DELETE FROM piani WHERE id = ?', [pianoId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Piano eliminato con successo' });
  });
});

// GET dettagli di un piano
router.get('/:id/dettagli', (req, res) => {
  const pianoId = req.params.id;
  const sqlPiano = 'SELECT * FROM piani WHERE id = ?';
  const sqlGiorni = `
    SELECT g.id, g.giorno_index, g.piano_id, p.id AS pasto_id, p.tipo_pasto
    FROM piani_giorni g
    LEFT JOIN piani_pasti p ON p.piano_giorno_id = g.id
    WHERE g.piano_id = ?
    ORDER BY p.tipo_pasto ASC
  `;

  db.get(sqlPiano, [pianoId], (err, piano) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all(sqlGiorni, [pianoId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const giorni = [];
      rows.forEach((row) => {
        let giorno = giorni.find((g) => g.id === row.id);
        if (!giorno) {
          giorno = { id: row.id, giorno_index: row.giorno_index, pasti: [] };
          giorni.push(giorno);
        }
        if (row.pasto_id) {
          giorno.pasti.push({
            id: row.pasto_id,
            tipo_pasto: row.tipo_pasto,
            alimenti: []
          });
        }
      });

      const pastoIds = rows.map(r => r.pasto_id).filter(Boolean);
      if (pastoIds.length === 0) return res.json({ piano, giorni });

      const sqlAlimenti = `
        SELECT ap.id AS alimento_pasto_id, ap.piano_pasto_id AS pasto_id,
               a.nome AS nomeAlimento, a.energia_kcal AS energia_kcal, ap.quantita
        FROM piani_alimenti ap
        JOIN alimenti a ON a.id = ap.alimento_id
        WHERE ap.piano_pasto_id IN (${pastoIds.join(',')})
      `;
      db.all(sqlAlimenti, [], (err, alimenti) => {
        if (err) return res.status(500).json({ error: err.message });
        alimenti.forEach((al) => {
          giorni.forEach((g) => {
            g.pasti.forEach((p) => {
              if (p.id === al.pasto_id) {
                p.alimenti.push(al);
              }
            });
          });
        });
        res.json({ piano, giorni });
      });
    });
  });
});

// POST aggiungi alimento a un pasto
router.post('/:id/aggiungi-alimento', (req, res) => {
  const { piano_pasto_id, alimento_id, quantita } = req.body;
  const sql = `
    INSERT INTO piani_alimenti (piano_pasto_id, alimento_id, quantita)
    VALUES (?, ?, ?)
  `;
  db.run(sql, [piano_pasto_id, alimento_id, quantita], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Alimento aggiunto con successo' });
  });
});

// DELETE rimuovi alimento
router.delete('/elimina-alimento/:id', (req, res) => {
  const alimentoPastoId = req.params.id;
  db.run('DELETE FROM piani_alimenti WHERE id = ?', [alimentoPastoId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Alimento rimosso' });
  });
});

module.exports = router;
