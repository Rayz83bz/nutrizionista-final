import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Form() {
  const [idPaziente, setIdPaziente] = useState('');
  const [dataVisita, setDataVisita] = useState('');
  const [peso, setPeso] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/visite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_paziente: idPaziente, data_visita: dataVisita, peso }),
    })
      .then(response => response.json())
      .then(() => navigate('/visite'))
      .catch(error => console.error('Errore durante l\'inserimento:', error));
  };

  return (
    <div>
      <h1>Nuova visita</h1>
      <form onSubmit={handleSubmit}>
        <label>ID Paziente:</label>
        <input value={idPaziente} onChange={(e) => setIdPaziente(e.target.value)} required />
        <br />
        <label>Data visita:</label>
        <input type="date" value={dataVisita} onChange={(e) => setDataVisita(e.target.value)} required />
        <br />
        <label>Peso (kg):</label>
        <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} required />
        <br /><br />
        <button type="submit">Salva visita</button>
      </form>
    </div>
  );
}

export default Form;
