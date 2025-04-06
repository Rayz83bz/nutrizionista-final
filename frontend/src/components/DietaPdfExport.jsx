// frontend/src/components/DietaPdfExport.jsx
import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DietaPdfExport({ paziente, settimanaTotale, fabbisogni, dieta }) {
  const handleExport = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Piano Dietetico - ${paziente?.nome || 'Paziente non selezionato'}`, 14, 20);

    doc.setFontSize(12);
    doc.text(`Totali Settimanali:`, 14, 30);
    doc.text(`Calorie: ${settimanaTotale.kcal.toFixed(1)} kcal`, 14, 38);
    doc.text(`Proteine: ${settimanaTotale.proteine.toFixed(1)} g`, 14, 46);
    doc.text(`Grassi: ${settimanaTotale.grassi.toFixed(1)} g`, 14, 54);
    doc.text(`Carboidrati: ${settimanaTotale.carboidrati.toFixed(1)} g`, 14, 62);

    if (fabbisogni) {
      doc.text(`Fabbisogni Settimanali:`, 110, 30);
      doc.text(`Calorie: ${(fabbisogni.fabbisogno_calorico * 7).toFixed(1)} kcal`, 110, 38);
      doc.text(`Proteine: ${(fabbisogni.proteine * 7).toFixed(1)} g`, 110, 46);
      doc.text(`Grassi: ${(fabbisogni.grassi * 7).toFixed(1)} g`, 110, 54);
      doc.text(`Carboidrati: ${(fabbisogni.carboidrati * 7).toFixed(1)} g`, 110, 62);
    }

    doc.autoTable({
      head: [['Giorno', 'Pasto', 'Alimento', 'Gr', 'Kcal', 'Prot.', 'Carb.', 'Grassi']],
      startY: 70,
      body: dieta.flatMap((giorno, dayIndex) =>
        giorno.flatMap((pasto, mealIndex) =>
          pasto.map((food) => [
            `Giorno ${dayIndex + 1}`,
            ['Colazione', 'Spuntino Matt.', 'Pranzo', 'Spuntino Pom.', 'Cena'][mealIndex],
            food.nome,
            `${food.grams} g`,
            food.energia_kcal,
            food.proteine,
            food.carboidrati,
            food.lipidi_totali
          ])
        )
      ),
    });

    doc.save(`Piano_dietetico_${paziente?.nome || 'paziente'}.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm mt-4"
    >
      📄 Esporta Dieta in PDF
    </button>
  );
}
