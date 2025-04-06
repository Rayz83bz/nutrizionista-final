import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DatabaseAlimentiForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    calorie: '',
    proteine: '',
    carboidrati: '',
    grassi: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/database-alimenti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        alert('Alimento aggiunto al database!');
        navigate('/database-alimenti');
      })
      .catch(err => console.error("Errore:", err));
  };

  return (
    <div>
      <h1>Aggiungi Nuovo Alimento</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="nome" 
          placeholder="Nome alimento" 
          value={formData.nome} 
          onChange={handleChange} 
          required 
        /><br />
        <input 
          type="number" 
          name="calorie" 
          placeholder="Calorie" 
          value={formData.calorie} 
          onChange={handleChange} 
          required 
        /><br />
        <input 
          type="number" 
          name="proteine" 
          placeholder="Proteine (g)" 
          value={formData.proteine} 
          onChange={handleChange} 
          required 
        /><br />
        <input 
          type="number" 
          name="carboidrati" 
          placeholder="Carboidrati (g)" 
          value={formData.carboidrati} 
          onChange={handleChange} 
          required 
        /><br />
        <input 
          type="number" 
          name="grassi" 
          placeholder="Grassi (g)" 
          value={formData.grassi} 
          onChange={handleChange} 
          required 
        /><br /><br />
        <button type="submit">Salva Alimento</button>
      </form>
    </div>
  );
};

export default DatabaseAlimentiForm;
