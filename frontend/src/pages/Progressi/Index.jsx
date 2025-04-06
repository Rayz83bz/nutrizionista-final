import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProgressChart from '../../components/ProgressChart';

function Index() {
  const [progressi, setProgressi] = useState([]);

  useEffect(() => {
    // Assicurati che l'endpoint sia corretto (controlla se è sulla porta 3001 o 5000)
    fetch('http://localhost:3001/api/progressi')
      .then(response => response.json())
      .then(data => setProgressi(data))
      .catch(error => console.error('Errore nel recupero dei progressi:', error));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Elenco Progressi</h1>
      <p>Visualizza i progressi registrati per ogni paziente.</p>
      <Link to="/progressi/nuovo">
        <button
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'background-color 0.3s',
            marginBottom: '20px'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          ➕ Registra nuovo progresso
        </button>
      </Link>
      
      {progressi.length > 0 && <ProgressChart progressData={progressi} />}
      
      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginTop: '20px' 
      }}>
        {progressi.map(progresso => (
          <div key={progresso.id} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '10px', 
            padding: '20px', 
            background: 'white', 
            boxShadow: '0px 2px 5px rgba(0,0,0,0.1)' 
          }}>
            <h3>Paziente: {progresso.paziente_nome}</h3>
            <p>Data: {progresso.data_misurazione}</p>
            <p>Peso: {progresso.peso} kg</p>
            <p>Massa grassa: {progresso.massa_grassa}%</p>
            <p>Note: {progresso.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Index;
