const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/app.sqlite');

// Mappatura API → colonne SQLite
const campi = {
  code: "Codice prodotto",
  product_name: "Nome",
  generic_name: "Nome generico",
  brands: "Marchio",
  categories: "Categorie",
  main_category: "Categoria principale",
  quantity: "Quantità",
  serving_size: "Porzione",
  nutrition_grade_fr: "Nutri-Score",
  image_url: "URL immagine",
  last_modified_t: "Ultima modifica",
  countries_tags: "Paesi disponibili",

  energy_100g: "Energia (kcal)",
  energy_kj_100g: "Energia (kJ)",
  energy-kcal_100g: "Calorie (kcal)",
  proteins_100g: "Proteine (g)",
  carbohydrates_100g: "Carboidrati (g)",
  sugars_100g: "Zuccheri (g)",
  fat_100g: "Grassi (g)",
  saturated_fat_100g: "Grassi saturi (g)",
  fiber_100g: "Fibra alimentare (g)",
  sodium_100g: "Sodio (mg)",
  salt_100g: "Sale (g)",
  vitamin_c_100g: "Vitamina C (mg)",
  calcium_100g: "Calcio (mg)",
  iron_100g: "Ferro (mg)",
  caffeine_100g: "Caffeina (mg)"
};

// Costruzione query insert dinamica
const colonne = Object.values(campi);
const placeholders = colonne.map(() => '?').join(',');
const insertQuery = `INSERT INTO alimenti (${colonne.map(c => `"${c}"`).join(',')}) VALUES (${placeholders})`;

function estraiValori(product) {
  return Object.keys(campi).map(key => {
    const val = product[key] || product.nutriments?.[key];
    if (typeof val === 'string') {
      return val.trim() === '' ? null : val.trim();
    }
    return val ?? null;
  });
}

async function importaDaApi() {
  let page = 1;
  let totali = 0;
  const pageSize = 100;

  while (true) {
    console.log(`📦 Pagina ${page}...`);

    const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&page=${page}&page_size=${pageSize}&fields=code,product_name,generic_name,brands,categories,main_category,quantity,serving_size,nutrition_grade_fr,image_url,last_modified_t,countries_tags,nutriments&country=italy`;

    try {
      const res = await axios.get(url);
      const prodotti = res.data.products;

      if (!prodotti.length) break;

      for (const p of prodotti) {
        if (p.states_tags?.includes("en:to-be-completed")) continue;
        if (!p.product_name || p.product_name.trim().length < 3 || /^\d+$/.test(p.product_name)) continue;

        const valori = estraiValori(p);

        db.run(insertQuery, valori, (err) => {
          if (err) console.error("❌ ERRORE:", err.message);
        });

        totali++;
        if (totali % 100 === 0) console.log(`✅ ${totali} inseriti`);
      }

      page++;
    } catch (err) {
      console.error("❌ ERRORE richiesta:", err.message);
      break;
    }
  }

  console.log(`🎯 Fine. Totale prodotti italiani importati: ${totali}`);
  db.close();
}

importaDaApi();
