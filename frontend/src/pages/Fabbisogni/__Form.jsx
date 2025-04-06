import React, { useState, useEffect, useCallback } from 'react';

let debounceTimer;

function Form() {
  const pazienteAttivo = JSON.parse(localStorage.getItem('pazienteAttivo'));
  const [formData, setFormData] = useState({
    energia_kcal: '',
    proteine_g: '',
    carboidrati_g: '',
    lipidi_g: '',
    note: ''
  });
function FabbisogniDieta({ idDieta }) {
  const [fabbisogni, setFabbisogni] = useState(null);

  useEffect(() => {
    if (idDieta) {
      fetch(`http://localhost:5000/api/fabbisogni_dieta/${idDieta}`)
        .then(res => res.json())
        .then(data => setFabbisogni(data))
        .catch(err => console.error('Errore caricamento fabbisogni dieta:', err));
    }
  }, [idDieta]);

  if (!fabbisogni) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4 text-sm">
      <h2 className="text-blue-700 font-semibold text-lg mb-2">⚙️ Fabbisogni Nutrizionali (Dieta)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <div><strong>Calorie:</strong> {fabbisogni.fabbisogno_calorico} kcal</div>
        <div><strong>Proteine:</strong> {fabbisogni.proteine} g</div>
        <div><strong>Grassi:</strong> {fabbisogni.grassi} g</div>
        <div><strong>Carboidrati:</strong> {fabbisogni.carboidrati} g</div>
      </div>
    </div>
  );
}

export default FabbisogniDieta;
  const [recordId, setRecordId] = useState(null); // serve per aggiornare
  const [calcoloInCorso, setCalcoloInCorso] = useState(false);

  const fetchFabbisogni = async () => {
    if (!pazienteAttivo) return;
    const res = await fetch(`http://localhost:5000/api/fabbisogni/${pazienteAttivo.id}`);
    const data = await res.json();
    if (data.length > 0) {
      setFormData(data[0]);
      setRecordId(data[0].id);
    }
  };

  useEffect(() => {
    if (!pazienteAttivo) {
      alert("⚠️ Seleziona prima un paziente attivo.");
      return;
    }
    fetchFabbisogni();
  }, [pazienteAttivo?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const debouncedSave = useCallback(() => {
    if (!pazienteAttivo) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const url = recordId
        ? `http://localhost:5000/api/fabbisogni/${recordId}`
        : 'http://localhost:5000/api/fabbisogni';

      const method = recordId ? 'PUT' : 'POST';
      const body = {
        ...formData,
        id_paziente: pazienteAttivo.id
      };

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const result = await res.json();
        if (!recordId && result.id) setRecordId(result.id);
        console.log('✅ Salvataggio riuscito:', result);
      } catch (err) {
        console.error('❌ Errore nel salvataggio automatico:', err);
      }
    }, 800);
  }, [formData, recordId, pazienteAttivo]);

  const handleBlur = () => {
    if (pazienteAttivo) debouncedSave();
  };

  const calcolaFabbisogniAutomatico = async () => {
    if (!pazienteAttivo?.id) return;
    setCalcoloInCorso(true);
    try {
      const res = await fetch(`http://localhost:5000/api/fabbisogni/calcola/${pazienteAttivo.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success || data.fabbisogni) {
        alert("✅ Fabbisogni calcolati e salvati automaticamente!");
        fetchFabbisogni(); // aggiorna il form
      } else {
        alert("❌ Errore nel calcolo: " + (data.error || "sconosciuto"));
      }
    } catch (err) {
      console.error("Errore nel calcolo automatico:", err);
      alert("❌ Errore durante il calcolo automatico.");
    } finally {
      setCalcoloInCorso(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Fabbisogni nutrizionali</h2>

      {!pazienteAttivo ? (
        <p className="text-red-500 font-semibold">⚠️ Nessun paziente attivo selezionato.</p>
      ) : (
        <>
          <form>
            <input
              type="number"
              name="energia_kcal"
              placeholder="Energia (kcal)"
              value={formData.energia_kcal}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full mb-3 p-2 border rounded"
            />
            <input
              type="number"
              name="proteine_g"
              placeholder="Proteine (g)"
              value={formData.proteine_g}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full mb-3 p-2 border rounded"
            />
            <input
              type="number"
              name="carboidrati_g"
              placeholder="Carboidrati (g)"
              value={formData.carboidrati_g}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full mb-3 p-2 border rounded"
            />
            <input
              type="number"
              name="lipidi_g"
              placeholder="Grassi (g)"
              value={formData.lipidi_g}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full mb-3 p-2 border rounded"
            />
            <textarea
              name="note"
              placeholder="Note opzionali"
              value={formData.note}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full p-2 border rounded"
            />
          </form>

          <div className="mt-4">
            <button
              onClick={calcolaFabbisogniAutomatico}
              disabled={calcoloInCorso}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {calcoloInCorso ? '⏳ Calcolo in corso...' : '⚙️ Calcola automaticamente dai dati avanzati'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Form;
