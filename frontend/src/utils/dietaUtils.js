// frontend/src/utils/dietaUtils.js

export function calcolaFabbisogniGiornalieri(fabbisogni) {
  if (!fabbisogni) return null;
  return {
    kcal: parseFloat(fabbisogni.fabbisogno_calorico || 0),
    proteine: parseFloat(fabbisogni.proteine || 0),
    grassi: parseFloat(fabbisogni.grassi || 0),
    carboidrati: parseFloat(fabbisogni.carboidrati || 0),
  };
}

export function calcolaTotaliSettimanali(dieta) {
  return dieta.reduce(
    (acc, day) => {
      day.forEach(meal => {
        meal.forEach(food => {
          acc.kcal += parseFloat(food.energia_kcal);
          acc.proteine += parseFloat(food.proteine);
          acc.grassi += parseFloat(food.lipidi_totali);
          acc.carboidrati += parseFloat(food.carboidrati);
        });
      });
      return acc;
    },
    { kcal: 0, proteine: 0, grassi: 0, carboidrati: 0 }
  );
}
// Funzione per suggerire alimenti in base a squilibri nutrizionali
// utils/dietaUtils.js
export const suggerisciAlimenti = (totali, fabbisogni) => {
  const suggerimenti = [];

  if (!fabbisogni) {
    suggerimenti.push("⚠️ Nessun fabbisogno paziente trovato. Impossibile suggerire.");
    return suggerimenti;
  }

  const sogliaMin = 0.9;
  const sogliaMax = 1.1;

  const check = (nutriente, label, suggerimento) => {
    const fabSett = (fabbisogni[nutriente] || 0) * 7;
    const val = totali[nutriente] || 0;
    const ratio = val / fabSett;
    if (ratio < sogliaMin) suggerimenti.push(`Aggiungi ${label.toLowerCase()}: ${suggerimento}`);
    else if (ratio > sogliaMax) suggerimenti.push(`Riduci ${label.toLowerCase()}: dieta eccessiva.`);
  };

  check("proteine", "Proteine", "carne magra, legumi, pesce");
  check("grassi", "Grassi", "olio EVO, frutta secca");
  check("carboidrati", "Carboidrati", "pane, pasta, cereali integrali");
  check("fabbisogno_calorico", "Calorie", "aggiungi pasti o aumentane le porzioni");

  if (suggerimenti.length === 0) {
    suggerimenti.push("Ottimo bilanciamento! Nessun aggiustamento consigliato.");
  }

  return suggerimenti;
};
