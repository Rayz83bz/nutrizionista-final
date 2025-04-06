import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TemplateDieteForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome_dieta: '',
    descrizione: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/template-diete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        alert('Template dieta aggiunto!');
        navigate('/template-diete');
      })
      .catch(err => console.error("Errore:", err));
  };

  return (
    <div>
      <h1>Aggiungi Template Dieta</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="nome_dieta" 
          placeholder="Nome dieta" 
          value={formData.nome_dieta} 
          onChange={handleChange} 
          required 
        /><br />
        <textarea 
          name="descrizione" 
          placeholder="Descrizione" 
          value={formData.descrizione} 
          onChange={handleChange} 
          required 
        /><br />
        <button type="submit">Salva Template</button>
      </form>
    </div>
  );
};

export default TemplateDieteForm;
