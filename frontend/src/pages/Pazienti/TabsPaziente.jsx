import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function TabsPaziente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paziente, setPaziente] = useState(null);
  const [ultimaVisita, setUltimaVisita] = useState(null);
  const [ultimaDieta, setUltimaDieta] = useState(null);
  const [datiVisite, setDatiVisite] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/pazienti/${id}`)
      .then((res) => res.json())
      .then((data) => setPaziente(data))
      .catch(() => alert('Errore nel caricamento del paziente'));

    fetch(`http://localhost:5000/api/visite/ultima/${id}`)
      .then((res) => res.json())
      .then((data) => setUltimaVisita(data))
      .catch(() => console.log('Nessuna visita trovata'));

    fetch(`http://localhost:5000/api/diete/ultima/${id}`)
      .then((res) => res.json())
      .then((data) => setUltimaDieta(data))
      .catch(() => console.log('Nessuna dieta trovata'));

    fetch(`http://localhost:5000/api/visite/paziente/${id}`)
      .then(res => res.json())
      .then(data => setDatiVisite(data))
      .catch(() => console.log('Errore nel recupero visite'));
  }, [id]);

  if (!paziente) return <div className="p-6 text-gray-500">⏳ Caricamento paziente...</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">
        {paziente.nome?.toUpperCase()} {paziente.cognome?.toUpperCase()}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <p><strong>Codice Fiscale:</strong> {paziente.codice_fiscale}</p>
        <p><strong>Email:</strong> {paziente.email || '-'}</p>
        <p><strong>Telefono:</strong> {paziente.telefono || '-'}</p>
        <p><strong>Altezza:</strong> {paziente.altezza || '-'} cm</p>
        <p><strong>Data creazione:</strong> {paziente.data_creazione || '-'}</p>
      </div>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">📌 Ultimi dati</h3>
        <ul className="text-sm text-gray-700 list-disc pl-5">
          {ultimaVisita ? (
            <li><strong>Ultima visita:</strong> {ultimaVisita.data_visita}</li>
          ) : (
            <li className="italic text-gray-400">Nessuna visita registrata</li>
          )}
          {ultimaDieta ? (
            <li><strong>Ultima dieta:</strong> {ultimaDieta.nome_dieta}</li>
          ) : (
            <li className="italic text-gray-400">Nessuna dieta disponibile</li>
          )}
        </ul>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        <button
          onClick={() => navigate(`/dati-avanzati/${paziente.id}`)}
          className="bg-sky-100 hover:bg-sky-200 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
        >
          📄 Dati Avanzati
        </button>
        <button
          onClick={() => navigate(`/dati-evolutivi/${paziente.id}`)}
          className="bg-indigo-100 hover:bg-indigo-200 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
        >
          📈 Evolutivi
        </button>
        <button
          onClick={() => navigate(`/fabbisogni/${paziente.id}`)}
          className="bg-yellow-100 hover:bg-yellow-200 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
        >
          🍽️ Fabbisogni
        </button>
        <button
          onClick={() => navigate(`/dieta/${paziente.id}`)}
          className="bg-lime-100 hover:bg-lime-200 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
        >
          🥗 Dieta
        </button>
        <button
          onClick={() => navigate(`/progressi/${paziente.id}`)}
          className="bg-pink-100 hover:bg-pink-200 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
        >
          📊 Progressi
        </button>
        <button
          onClick={() => navigate(`/pazienti/${paziente.id}/modifica`)}
          className="bg-blue-100 hover:bg-blue-200 px-3 py-2 rounded text-sm flex items-center justify-center gap-2"
        >
          ✏️ Modifica
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">📊 Grafici evolutivi</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border rounded p-3 shadow">
            <h4 className="font-bold text-sm mb-1">Peso nel tempo (kg)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={datiVisite}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data_visita" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="peso" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border rounded p-3 shadow">
            <h4 className="font-bold text-sm mb-1">Glicemia (mg/dL)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={datiVisite}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data_visita" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="glicemia" stroke="#ef4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">🚀 Prossimo step</h3>
        <p className="text-sm text-gray-600 mb-3">Puoi avviare direttamente il processo guidato di visita → fabbisogni → dieta.</p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/dati-avanzati?for=${paziente.id}`)}
            className="bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded text-sm"
          >
            🧠 Nuova Visita
          </button>
          <button
            onClick={() => navigate(`/fabbisogni?for=${paziente.id}`)}
            className="bg-yellow-100 hover:bg-yellow-200 px-4 py-2 rounded text-sm"
          >
            🍽️ Calcola Fabbisogni
          </button>
          <button
            onClick={() => navigate(`/dieta?for=${paziente.id}`)}
            className="bg-lime-100 hover:bg-lime-200 px-4 py-2 rounded text-sm"
          >
            🥗 Componi Dieta
          </button>
        </div>
      </div>
    </div>
  );
}
