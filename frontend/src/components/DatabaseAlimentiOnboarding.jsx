import React, { useState } from 'react';

const DatabaseAlimentiOnboarding = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div style={{ background: '#f0f4ff', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
      <h3>Benvenuto nel Database Alimenti!</h3>
      <ul>
        <li>🔎 Usa la barra di ricerca per trovare rapidamente un alimento.</li>
        <li>📂 Seleziona una categoria per filtrare.</li>
        <li>📊 Clicca su un alimento per vedere dettagli e grafici a torta.</li>
        <li>🆚 Puoi confrontare più alimenti aggiungendoli al comparatore!</li>
        <li>🖨️ Stampa o esporta la tua selezione cliccando su "Stampa comparativa".</li>
      </ul>
      <button onClick={() => setVisible(false)} style={{ marginTop: '10px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px' }}>
        ✅ Chiudi guida
      </button>
    </div>
  );
};

export default DatabaseAlimentiOnboarding;
