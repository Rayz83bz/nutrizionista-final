import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Visite() {
  const [visite, setVisite] = useState([]);
  const [formData, setFormData] = useState({
    data: '',
    peso: '',
    attivita_fisica: '',
    glicemia: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [paziente, setPaziente] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const salvato = localStorage.getItem('pazienteAttivo');
    const pazienteAttivo = salvato ? JSON.parse(salvato) : null;
    if (!pazienteAttivo || !pazienteAttivo.id) {
      alert('⚠️ Seleziona un paziente per visualizzare le visite');
      return;
    }
    setPaziente(pazienteAttivo);
    caricaVisite(pazienteAttivo.id);
  }, []);

  const caricaVisite = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/dati-avanzati/paziente/${id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setVisite(data);
      } else {
        console.error('❌ Formato dati non valido', data);
        setVisite([]);
      }
    } catch (err) {
      console.error('❌ Errore caricamento visite', err);
    }
  };

  const salvaVisita = async () => {
    if (!formData.data || !formData.peso) {
      alert('Inserisci almeno data e peso');
      return;
    }

    const url = editingId
      ? `http://localhost:5000/api/dati-avanzati/${editingId}`
      : 'http://localhost:5000/api/dati-avanzati';

    const method = editingId ? 'PUT' : 'POST';

    const payload = {
      ...formData,
      id_paziente: paziente.id,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Errore salvataggio visita');
      setFormData({ data: '', peso: '', attivita_fisica: '', glicemia: '' });
      setEditingId(null);
      await caricaVisite(paziente.id);
    } catch (err) {
      console.error('❌ Errore salvataggio visita', err);
      alert('❌ Errore nel salvataggio');
    }
  };

  const modificaVisita = (visita) => {
    setFormData({
      data: visita.data,
      peso: visita.peso || '',
      attivita_fisica: visita.attivita_fisica || '',
      glicemia: visita.glicemia || ''
    });
    setEditingId(visita.id);
  };

  const eliminaVisita = async (id) => {
    if (!window.confirm('Eliminare questa visita?')) return;
    try {
      await fetch(`http://localhost:5000/api/dati-avanzati/${id}`, {
        method: 'DELETE'
      });
      await caricaVisite(paziente.id);
    } catch (err) {
      console.error('❌ Errore eliminazione visita', err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">📅 Visite per {paziente?.nome} {paziente?.cognome}</h1>

      {/* FORM INSERIMENTO/MODIFICA */}
      <div className="bg-white p-4 rounded shadow mb-6 space-y-2">
        <div className="flex gap-4">
          <input
            type="date"
            className="border p-2 rounded w-1/4"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
          />
          <input
            type="number"
            placeholder="Peso (kg)"
            className="border p-2 rounded w-1/4"
            value={formData.peso}
            onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
          />
          <input
            type="text"
            placeholder="Attività fisica"
            className="border p-2 rounded w-1/4"
            value={formData.attivita_fisica}
            onChange={(e) => setFormData({ ...formData, attivita_fisica: e.target.value })}
          />
          <input
            type="number"
            placeholder="Glicemia"
            className="border p-2 rounded w-1/4"
            value={formData.glicemia}
            onChange={(e) => setFormData({ ...formData, glicemia: e.target.value })}
          />
        </div>
        <button
          onClick={salvaVisita}
          className={`px-4 py-2 rounded text-white ${editingId ? 'bg-yellow-500' : 'bg-blue-600'} hover:opacity-90`}
        >
          {editingId ? '✏️ Aggiorna visita' : '➕ Salva visita'}
        </button>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ data: '', peso: '', attivita_fisica: '', glicemia: '' });
            }}
            className="ml-2 px-3 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black"
          >
            Annulla
          </button>
        )}
      </div>

      {/* VISITE */}
      {visite.length === 0 ? (
        <p className="italic text-gray-500">Nessuna visita registrata.</p>
      ) : (
        <div className="space-y-4">
          {visite.map((v) => (
            <div
              key={v.id}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div className="text-sm">
                <div className="font-bold text-blue-600">{v.data}</div>
                <div>Peso: <strong>{v.peso} kg</strong></div>
                {v.attivita_fisica && <div>Attività: {v.attivita_fisica}</div>}
                {v.glicemia && <div>Glicemia: {v.glicemia} mg/dL</div>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => modificaVisita(v)}
                  className="text-yellow-600 hover:underline text-sm"
                >
                  ✏️ Modifica
                </button>
                <button
                  onClick={() => eliminaVisita(v.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  🗑️ Elimina
                </button>
                <button
                  onClick={() => navigate(`/diete?fromVisita=${v.id}`)}
                  className="text-green-600 hover:underline text-sm"
                >
                  ➕ Crea dieta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
