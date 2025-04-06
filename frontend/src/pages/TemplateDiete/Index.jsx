import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const TemplateDieteIndex = () => {
  const [diete, setDiete] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/template-diete')
      .then(res => res.json())
      .then(data => setDiete(data))
      .catch(err => console.error("Errore nel recupero delle template diete:", err));
  }, []);

  return (
    <div>
      <h1>Template Diete</h1>
      <Link to="/template-diete/nuovo">
        <button>Aggiungi nuovo template dieta</button>
      </Link>
      <ul>
        {diete.map(dieta => (
          <li key={dieta.id}>
            {dieta.nome_dieta} - {dieta.descrizione}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TemplateDieteIndex;
