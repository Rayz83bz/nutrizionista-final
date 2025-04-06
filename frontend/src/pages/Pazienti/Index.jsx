import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaPlus, FaUserEdit, FaTrash, FaHeartbeat, FaAppleAlt,
  FaChartLine, FaUtensils
} from 'react-icons/fa';

import { usePaziente } from '../../App'; // importa dal context

const PazientiIndex = () => {
  const [pazienti, setPazienti] = useState([]);
  const { pazienteAttivo, seleziona, deseleziona } = usePaziente();
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/pazienti')
      .then(response => setPazienti(response.data))
      .catch(error => console.error("Errore nel recupero pazienti:", error));
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Vuoi davvero eliminare questo paziente?')) {
      axios.delete(`http://localhost:5000/api/pazienti/${id}`)
        .then(() => {
          setPazienti(prev => prev.filter(p => p.id !== id));
          if (pazienteAttivo?.id === id) deseleziona();
        });
    }
  };

  const impostaEApri = (paziente, rotta) => {
    seleziona(paziente);
    navigate(rotta);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Elenco Pazienti</h1>
        <button
          onClick={() => navigate("/pazienti/nuovo")}
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 shadow"
        >
          <FaPlus className="mr-2" /> Aggiungi Paziente
        </button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {pazienti.length === 0 ? (
          <p className="text-gray-500">Nessun paziente registrato.</p>
        ) : (
          pazienti.map((paziente) => {
            const isAttivo = pazienteAttivo?.id === paziente.id;
            return (
<div
  key={paziente.id}
  className={`relative bg-white shadow-xl rounded-2xl p-6 flex flex-col justify-between border transition-all ${
    isAttivo ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100 hover:shadow-2xl'
  }`}
>
  {isAttivo && (
    <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full shadow-sm">
      ✅ ATTIVO
    </div>
  )}

                <div>
                  <h2
                    className="text-2xl font-semibold text-blue-700 mb-2 cursor-pointer hover:underline"
                    onClick={() => navigate(`/pazienti/${paziente.id}`)}
                  >
                    {paziente.nome} {paziente.cognome}
                  </h2>

                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <p><strong>Codice fiscale:</strong> {paziente.codice_fiscale}</p>
                    <p><strong>Email:</strong> {paziente.email || '-'}</p>
                    <p><strong>Telefono:</strong> {paziente.telefono || '-'}</p>
                    <p><strong>Altezza:</strong> {paziente.altezza || '-'} cm</p>
                    <p><strong>Data creazione:</strong> {paziente.data_creazione || '-'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <button onClick={() => impostaEApri(paziente, '/dati-evolutivi')} className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl hover:bg-indigo-200">
                      <FaChartLine /> Evolutivi
                    </button>
                    <button onClick={() => impostaEApri(paziente, '/fabbisogni')} className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-2 rounded-xl hover:bg-amber-200">
                      <FaHeartbeat /> Fabbisogni
                    </button>
                    <button onClick={() => impostaEApri(paziente, '/diete')} className="flex items-center gap-2 bg-lime-100 text-lime-700 px-3 py-2 rounded-xl hover:bg-lime-200">
                      <FaUtensils /> Dieta
                    </button>
                    <button onClick={() => impostaEApri(paziente, '/progressi')} className="flex items-center gap-2 bg-pink-100 text-pink-700 px-3 py-2 rounded-xl hover:bg-pink-200">
                      <FaAppleAlt /> Progressi
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-6 justify-end">
                  <button
                    onClick={() => impostaEApri(paziente, '/visite')}
                    className="flex items-center bg-purple-500 text-white px-3 py-1.5 rounded hover:bg-purple-600"
                  >
                    🧠 Inserisci Visita
                  </button>
                  <button
                    onClick={() => navigate(`/pazienti/${paziente.id}/modifica`)}
                    className="flex items-center bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600"
                  >
                    <FaUserEdit className="mr-1" /> Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(paziente.id)}
                    className="flex items-center bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600"
                  >
                    <FaTrash className="mr-1" /> Elimina
                  </button>
                  <button
                    onClick={() => isAttivo ? deseleziona() : seleziona(paziente)}
                    className={`flex items-center ${isAttivo ? 'bg-gray-300 text-gray-800' : 'bg-green-100 text-green-700'} px-3 py-1.5 rounded hover:opacity-90`}
                  >
                    {isAttivo ? '❌ Deseleziona' : '🔹 Seleziona'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PazientiIndex;
