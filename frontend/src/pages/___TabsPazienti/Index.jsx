import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const TabsPazienti = () => {
  const { id } = useParams();
  const [paziente, setPaziente] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:5000/api/pazienti/${id}`)
        .then((res) => res.json())
        .then((data) => setPaziente(data))
        .catch((err) => console.error("Errore nel recupero del paziente:", err));
    }
  }, [id]);

  if (!paziente) return <p>Caricamento dati...</p>;

  return (
    <div>
      <h1>Scheda completa di {paziente.nome} {paziente.cognome}</h1>
      <ul>
        <li><Link to={`/pazienti/anagrafica/${id}`}>📄 Anagrafica</Link></li>
        <li><Link to={`/pazienti/fabbisogni/${id}`}>📊 Fabbisogni</Link></li>
        <li><Link to={`/visite/paziente/${id}`}>📅 Visite</Link></li>
      </ul>
      <Link to="/pazienti">
        <button style={{ marginTop: '20px' }}>🔙 Torna alla lista pazienti</button>
      </Link>
    </div>
  );
};

export default TabsPazienti;
