import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FabbisogniIndex() {
  const stored = localStorage.getItem('pazienteAttivo');
  const pazienteAttivo = stored ? JSON.parse(stored) : null;

  const [fabbisogni, setFabbisogni] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFabbisogni = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/fabbisogni/${pazienteAttivo.id}`)
      .then(res => res.json())
      .then(data => {
        setFabbisogni(data[0] || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Errore nel caricamento dei fabbisogni:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (pazienteAttivo?.id) {
      fetchFabbisogni();
    }
  }, [pazienteAttivo]);

  const handleCalcoloAutomatico = () => {
    if (!window.confirm("Vuoi calcolare automaticamente i fabbisogni da dati avanzati del paziente?")) return;
    fetch(`http://localhost:5000/api/fabbisogni/calcola/${pazienteAttivo.id}`, {
      method: 'POST'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("✅ Fabbisogni calcolati automaticamente.");
          fetchFabbisogni();
        } else {
          alert("⚠️ Calcolo non riuscito: " + (data.error || "Errore sconosciuto"));
        }
      })
      .catch(err => {
        console.error("Errore nel calcolo automatico:", err);
        alert("❌ Errore nel calcolo automatico");
      });
  };

  const handleModificaManuale = () => {
    navigate('/fabbisogni/form');
  };

  if (!pazienteAttivo?.id) {
    alert("⚠️ Devi selezionare un paziente prima di accedere ai fabbisogni.");
    return <p className="p-4 text-red-600">⚠️ Nessun paziente attivo selezionato.</p>;
  }

  if (loading) {
    return <p className="p-4">⏳ Caricamento in corso...</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">
        Fabbisogni nutrizionali di {pazienteAttivo.nome} {pazienteAttivo.cognome}
      </h2>

      <div className="mb-4 flex gap-4">
        <button
          onClick={handleCalcoloAutomatico}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
        >
          ⚙️ Calcola automaticamente
        </button>
        <button
          onClick={handleModificaManuale}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded"
        >
          ✏️ Modifica manuale
        </button>
      </div>

      {fabbisogni ? (
        <table className="w-full text-left border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Nutriente</th>
              <th className="p-2">Valore</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(fabbisogni).map(([key, val]) => (
              key !== 'id' && key !== 'id_paziente' && (
                <tr key={key} className="border-t">
                  <td className="p-2 capitalize">{key.replace(/_/g, ' ')}</td>
                  <td className="p-2">{val}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      ) : (
        <p className="p-4 text-yellow-600">⚠️ Nessun fabbisogno salvato per questo paziente.</p>
      )}
    </div>
  );
}

export default FabbisogniIndex;
