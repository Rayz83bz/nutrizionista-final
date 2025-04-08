// server.js
const express = require('express');
const cors = require('cors');

// Importa i router modulari
const pazientiRoutes = require('./routes/pazienti');
const alimentiRoutes = require('./routes/databaseAlimenti');
const pianiRoutes = require('./routes/piani');
const dieteRoutes = require('./routes/diete');
const progressiRoutes = require('./routes/progressi');
const fabbisogniRoutes = require('./routes/fabbisogni');
const visiteRoutes = require('./routes/visite'); // ✅ quello nuovo e corretto
const datiAvanzatiRoutes = require('./routes/datiAvanzati'); // solo se ti serve ancora

const app = express();
app.use(cors());
app.use(express.json());

// Usa i router
app.use('/api/pazienti', pazientiRoutes);
app.use('/api/database-alimenti', alimentiRoutes);
app.use('/api/piani', pianiRoutes);
app.use('/api/diete', dieteRoutes);
app.use('/api/progressi', progressiRoutes);
app.use('/api/fabbisogni', fabbisogniRoutes);
app.use('/api/visite', visiteRoutes); // ✅ corretto
app.use('/api/dati-avanzati', datiAvanzatiRoutes); // 👈 opzionale

app.get('/', (req, res) => {
  res.send('Server is running');
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server in ascolto sulla porta ${PORT}`);
});

const path = require('path');

// Serve il frontend React
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});
