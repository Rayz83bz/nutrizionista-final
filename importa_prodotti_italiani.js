const fs = require('fs');
const zlib = require('zlib');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

const db = new sqlite3.Database('./db/app.sqlite'); // <-- corretto path
const filePath = './en.openfoodfacts.org.products.csv.gz';              // <-- nome corretto del file compresso

// CSV → Colonna DB (nomi esatti)
const campi = {
  "code" : "Codice prodotto",
  "product_name" : "Nome",
  "generic_name" : "Nome generico",
  "brands" : "Marchio",
  "categories" : "Categorie",
  "main_category" : "Categoria principale",
  "quantity" : "Quantità",
  "serving_size" : "Porzione",
  "nutrition_grade_fr" : "Nutri-Score",
  "image_url" : "URL immagine",
  "last_modified_t" : "Ultima modifica",
  "countries_tags" : "Paesi disponibili",

  "energy_100g" : "Energia (kcal)",
  "energy-kj_100g" : "Energia (kJ)",
  "energy-kcal_100g" : "Calorie (kcal)",
  "proteins_100g" : "Proteine (g)",
  "casein_100g" : "Caseina (g)",
  "serum-proteins_100g" : "Proteine del siero (g)",
  "nucleotides_100g" : "Nucleotidi (g)",
  "carbohydrates_100g" : "Carboidrati (g)",
  "sugars_100g" : "Zuccheri (g)",
  "sucrose_100g" : "Saccarosio (g)",
  "glucose_100g" : "Glucosio (g)",
  "fructose_100g" : "Fruttosio (g)",
  "lactose_100g" : "Lattosio (g)",
  "maltose_100g" : "Maltosio (g)",
  "maltodextrins_100g" : "Maltodestrine (g)",
  "starch_100g" : "Amido (g)",
  "polyols_100g" : "Polioli (g)",
  "fat_100g" : "Grassi (g)",
  "saturated-fat_100g" : "Grassi saturi (g)",
  "trans-fat_100g" : "Grassi trans (g)",
  "cholesterol_100g" : "Colesterolo (mg)",
  "fiber_100g" : "Fibra alimentare (g)",
  "sodium_100g" : "Sodio (mg)",
  "alcohol_100g" : "Alcol (g)",

  // acidi grassi
  "butyric-acid_100g": "Acido butirrico (g)",
  "caproic-acid_100g": "Acido caproico (g)",
  "caprylic-acid_100g": "Acido caprilico (g)",
  "capric-acid_100g": "Acido caprico (g)",
  "lauric-acid_100g": "Acido laurico (g)",
  "myristic-acid_100g": "Acido miristico (g)",
  "palmitic-acid_100g": "Acido palmitico (g)",
  "stearic-acid_100g": "Acido stearico (g)",
  "arachidic-acid_100g": "Acido arachidico (g)",
  "behenic-acid_100g": "Acido beenico (g)",
  "lignoceric-acid_100g": "Acido lignocerico (g)",
  "cerotic-acid_100g": "Acido cerotico (g)",
  "montanic-acid_100g": "Acido montanico (g)",
  "melissic-acid_100g": "Acido melissico (g)",
  "monounsaturated-fat_100g": "Grassi monoinsaturi (g)",
  "polyunsaturated-fat_100g": "Grassi polinsaturi (g)",
  "omega-3-fat_100g": "Grassi Omega-3 (g)",
  "alpha-linolenic-acid_100g": "Acido α-linolenico (g)",
  "eicosapentaenoic-acid_100g": "EPA (g)",
  "docosahexaenoic-acid_100g": "DHA (g)",
  "omega-6-fat_100g": "Grassi Omega-6 (g)",
  "linoleic-acid_100g": "Acido linoleico (g)",
  "arachidonic-acid_100g": "Acido arachidonico (g)",
  "gamma-linolenic-acid_100g": "Acido γ-linolenico (g)",
  "dihomo-gamma-linolenic-acid_100g": "Acido dihomo-γ-linolenico (g)",
  "omega-9-fat_100g": "Grassi Omega-9 (g)",
  "oleic-acid_100g": "Acido oleico (g)",
  "elaidic-acid_100g": "Acido elaidico (g)",
  "gondoic-acid_100g": "Acido gondoico (g)",
  "mead-acid_100g": "Acido meadico (g)",
  "erucic-acid_100g": "Acido erucico (g)",
  "nervonic-acid_100g": "Acido nervonico (g)",

  // vitamine
  "vitamin-a_100g": "Vitamina A (µg)",
  "vitamin-d_100g": "Vitamina D (µg)",
  "vitamin-e_100g": "Vitamina E (mg)",
  "vitamin-k_100g": "Vitamina K (µg)",
  "vitamin-c_100g": "Vitamina C (mg)",
  "vitamin-b1_100g": "Vitamina B1 (mg)",
  "vitamin-b2_100g": "Vitamina B2 (mg)",
  "vitamin-pp_100g": "Niacina (mg)",
  "vitamin-b6_100g": "Vitamina B6 (mg)",
  "vitamin-b9_100g": "Folati (µg)",
  "vitamin-b12_100g": "Vitamina B12 (µg)",
  "biotin_100g": "Biotina (µg)",
  "pantothenic-acid_100g": "Acido pantotenico (mg)",

  // minerali
  "silica_100g": "Silice (mg)",
  "bicarbonate_100g": "Bicarbonato (mg)",
  "potassium_100g": "Potassio (mg)",
  "chloride_100g": "Cloruro (mg)",
  "calcium_100g": "Calcio (mg)",
  "phosphorus_100g": "Fosforo (mg)",
  "iron_100g": "Ferro (mg)",
  "magnesium_100g": "Magnesio (mg)",
  "zinc_100g": "Zinco (mg)",
  "copper_100g": "Rame (mg)",
  "manganese_100g": "Manganese (mg)",
  "fluoride_100g": "Fluoro (mg)",
  "selenium_100g": "Selenio (µg)",
  "chromium_100g": "Cromo (µg)",
  "molybdenum_100g": "Molibdeno (µg)",
  "iodine_100g": "Iodio (µg)",

  // altri
  "caffeine_100g": "Caffeina (mg)",
  "taurine_100g": "Taurina (mg)",
  "ph_100g": "pH",
  "carbon-footprint_100g": "Impronta di CO₂ (g)",
  "fruits-vegetables-nuts_100g": "% Frutta/Verdura/Noci (escluso patate)"
};

// colonna SQL da inserire
const colonneDB = Object.values(campi).filter(c => c !== "Paesi disponibili");

const creaQuery = () => {
  const col = colonneDB.map(c => `"${c}"`).join(", ");
  const placeholders = colonneDB.map(() => "?").join(", ");
  return `INSERT INTO alimenti (${col}) VALUES (${placeholders})`;
};

const insertQuery = creaQuery();

// Sanifica e converte in numero
function pulisci(val) {
  if (val === undefined || val === '') return null;
  const clean = val.replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? val : num;
}

let count = 0;

fs.createReadStream(filePath)
  .pipe(zlib.createGunzip())
  .pipe(csv({ separator: '\t' }))
  .on('data', (row) => {
    try {
      if (!row.countries_tags?.includes('italy')) return;

      const valori = Object.entries(campi)
        .filter(([k, v]) => v !== "Paesi disponibili")
        .map(([campoCSV]) => pulisci(row[campoCSV]));

      db.run(insertQuery, valori, (err) => {
        if (err) console.error('❌ Errore:', err.message);
      });

      if (++count % 1000 === 0) console.log(`✔ ${count} prodotti italiani inseriti`);
    } catch (e) {
      console.error("⚠️ Errore riga:", e.message);
    }
  })
  .on('end', () => {
    console.log(`🎯 Fine! Importati ${count} prodotti italiani.`);
    db.close();
  });
