-- migration.sql

-- Tabella pazienti
CREATE TABLE IF NOT EXISTS pazienti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cognome TEXT,
  codice_fiscale TEXT,
  email TEXT,
  telefono TEXT,
  peso REAL,
  altezza REAL,
  data_creazione TEXT DEFAULT (datetime('now'))
);

-- Tabella alimenti
CREATE TABLE IF NOT EXISTS alimenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  categoria TEXT,
  energia_kcal REAL,
  proteine REAL,
  carboidrati REAL,
  grassi REAL,
  fibra REAL,
  zuccheri REAL
);

-- Tabella piani (piani alimentari)
CREATE TABLE IF NOT EXISTS piani (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paziente_id INTEGER,
  nome TEXT,
  descrizione TEXT,
  data_inizio TEXT,
  data_fine TEXT,
  FOREIGN KEY (paziente_id) REFERENCES pazienti(id)
);

-- Tabella piani_giorni
CREATE TABLE IF NOT EXISTS piani_giorni (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  piano_id INTEGER,
  giorno_index INTEGER,
  data_giorno TEXT,
  FOREIGN KEY (piano_id) REFERENCES piani(id)
);

-- Tabella piani_pasti
CREATE TABLE IF NOT EXISTS piani_pasti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  piano_giorno_id INTEGER,
  tipo_pasto TEXT,
  FOREIGN KEY (piano_giorno_id) REFERENCES piani_giorni(id)
);

-- Tabella piani_alimenti
CREATE TABLE IF NOT EXISTS piani_alimenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  piano_pasto_id INTEGER,
  alimento_id INTEGER,
  quantita REAL,
  FOREIGN KEY (piano_pasto_id) REFERENCES piani_pasti(id),
  FOREIGN KEY (alimento_id) REFERENCES alimenti(id)
);

-- Tabella diete (salvataggio della dieta completa in JSON)
CREATE TABLE IF NOT EXISTS diete (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paziente_id INTEGER,
  dati TEXT,
  data_creazione TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (paziente_id) REFERENCES pazienti(id)
);

-- Tabella progressi
CREATE TABLE IF NOT EXISTS progressi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paziente_id INTEGER,
  data_misurazione TEXT,
  peso REAL,
  massa_grassa REAL,
  note TEXT,
  FOREIGN KEY (paziente_id) REFERENCES pazienti(id)
);

-- Tabella visite (opzionale)
CREATE TABLE IF NOT EXISTS visite (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paziente_id INTEGER,
  data_visita TEXT,
  note TEXT,
  FOREIGN KEY (paziente_id) REFERENCES pazienti(id)
);
