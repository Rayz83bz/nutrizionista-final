// db/index.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Unico database unificato
const dbPath = path.join(__dirname, 'app.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Errore nella connessione al database:", err);
  } else {
    db.run("PRAGMA foreign_keys = ON;");
    console.log("✅ Database connesso e foreign keys attivate.");
  }
});

module.exports = db;
