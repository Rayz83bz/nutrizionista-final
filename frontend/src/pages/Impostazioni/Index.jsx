import React, { useState, useEffect } from 'react';

const temiDisponibili = [
  { value: 'palette_default', label: 'Tema chiaro (default)' },
  { value: 'palette_elegant', label: 'Elegante (grigio/verde)' },
  { value: 'palette_dark', label: 'Scuro (dark mode)' },
  { value: 'palette_softgray', label: 'Soft grigio/viola' }
];

const Impostazioni = () => {
  const [tema, setTema] = useState(localStorage.getItem('tema_attivo') || 'palette_default');

  const cambiaTema = (nuovoTema) => {
    setTema(nuovoTema);
    localStorage.setItem('tema_attivo', nuovoTema);
    document.body.className = nuovoTema; // Applichiamo classe al <body>
  };

  useEffect(() => {
    document.body.className = tema; // Inizializza il tema quando apro la pagina
  }, [tema]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Impostazioni</h1>

      <div className="mb-6">
        <label className="block font-medium mb-2">🎨 Seleziona il tema dell'interfaccia:</label>
        <select
          value={tema}
          onChange={(e) => cambiaTema(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          {temiDisponibili.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <hr className="my-6" />

      <p className="text-gray-500">Altre impostazioni in arrivo...</p>
    </div>
  );
};

export default Impostazioni;
