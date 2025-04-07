import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DietaForm() {
  const [diete, setDiete] = useState([]);
  const [paziente, setPaziente] = useState(null);
  const navigate = useNavigate();

useEffect(() => {
  const fetchDiete = async () => {
    const salvato = localStorage.getItem('pazienteAttivo');
    const pazienteAttivo = salvato ? JSON.parse(salvato) : null;

    if (!pazienteAttivo || !pazienteAttivo.id) {
      alert('⚠️ Seleziona un paziente per vedere le diete.');
      return;
    }

    setPaziente(pazienteAttivo);

    try {
      const res = await fetch(`http://localhost:5000/api/diete/${pazienteAttivo.id}`);
      const json = await res.json();

      console.log("📦 Risposta grezza dal backend:", json);

      if (!json.success || !Array.isArray(json.data)) {
        console.warn("⚠️ Nessuna dieta trovata o formato errato:", json);
        setDiete([]);
        return;
      }

      const conFabbisogni = await Promise.all(
        json.data.map(async dieta => {
          try {
            const res = await fetch(`http://localhost:5000/api/fabbisogni-dieta/${dieta.id}`);
            const fab = await res.json();
            return { ...dieta, fabbisogni_dieta: fab };
          } catch {
            return { ...dieta, fabbisogni_dieta: null };
          }
        })
      );

      setDiete(conFabbisogni);
    } catch (err) {
      console.error("❌ Errore fetch diete:", err);
      setDiete([]);
    }
  };

  fetchDiete();
}, []);

  const handleApriDieta = (dieta) => {
    if (!dieta?.id) {
      alert('❌ Dieta non valida');
      return;
    }
    navigate(`/diete?edit=${dieta.id}`);
  };

  const handleDuplica = async (dieta) => {
    try {
      const res = await fetch(`http://localhost:5000/api/diete/dettaglio/${dieta.id}`);
      const json = await res.json();

      if (!json.success || !json.data || !json.data.giorni) {
        alert('❌ Dati non validi per duplicare questa dieta');
        return;
      }

      const nuovoNome = prompt('Nome per la dieta duplicata:', `${dieta.nome_dieta} (copia)`);
      if (!nuovoNome) return;

      await fetch('http://localhost:5000/api/diete/salva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pazienteId: paziente.id,
          id_visita: json.data.id_visita,
          nome_dieta: nuovoNome,
          giorni: json.data.giorni,
        }),
      });

      const updated = await fetch(`http://localhost:5000/api/diete/${paziente.id}`).then(r => r.json());
      setDiete(updated.data || []);
      alert('✅ Dieta duplicata');
    } catch (err) {
      console.error(err);
      alert('❌ Errore duplicazione');
    }
  };

  const handleElimina = async (id) => {
    if (!window.confirm('Confermi eliminazione?')) return;

    try {
      await fetch(`http://localhost:5000/api/diete/${id}`, { method: 'DELETE' });
      const updated = await fetch(`http://localhost:5000/api/diete/${paziente.id}`).then(r => r.json());
      setDiete(updated.data || []);
      alert('✅ Dieta eliminata');
    } catch (err) {
      console.error(err);
      alert('❌ Errore eliminazione');
    }
  };

  const aggiornaNomeDieta = async (id, nuovoNome) => {
    try {
      await fetch(`http://localhost:5000/api/diete/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_dieta: nuovoNome }),
      });
      const updated = await fetch(`http://localhost:5000/api/diete/${paziente.id}`).then(r => r.json());
      setDiete(updated.data || []);
    } catch (err) {
      console.error(err);
      alert('❌ Errore aggiornamento nome');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        📋 Diete salvate per {paziente?.nome} {paziente?.cognome}
      </h1>

      {diete.length === 0 ? (
        <p className="text-gray-500 italic">Nessuna dieta salvata per questo paziente.</p>
      ) : (
        <div className="space-y-4">
          {diete.map((dieta) => (
            <div key={dieta.id} className="border rounded shadow p-4 bg-white flex justify-between items-start">
              <div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const nuovoNome = e.target.textContent.trim();
                    if (nuovoNome && nuovoNome !== dieta.nome_dieta) {
                      aggiornaNomeDieta(dieta.id, nuovoNome);
                    }
                  }}
                  className="font-semibold text-lg outline-none hover:bg-yellow-100 px-1 rounded"
                  title="Clicca per modificare il nome"
                >
                  {dieta.nome_dieta}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  Salvata il {
                    dieta.data_creazione && !isNaN(new Date(dieta.data_creazione))
                      ? new Date(dieta.data_creazione).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : 'data sconosciuta'
                  }
                </div>

                {dieta.fabbisogni_dieta && (
                  <div className="mt-2 text-sm text-blue-700 bg-blue-50 rounded p-2">
                    <strong>Fabbisogni:</strong><br />
                    {dieta.fabbisogni_dieta.fabbisogno_calorico} kcal –
                    {dieta.fabbisogni_dieta.proteine}g P –
                    {dieta.fabbisogni_dieta.grassi}g G –
                    {dieta.fabbisogni_dieta.carboidrati}g C
                  </div>
                )}
              </div>

              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => handleApriDieta(dieta)}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  ✏️ Modifica
                </button>
                <button
                  onClick={() => handleDuplica(dieta)}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  📄 Duplica
                </button>
                <button
                  onClick={() => handleElimina(dieta.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  🗑️ Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
