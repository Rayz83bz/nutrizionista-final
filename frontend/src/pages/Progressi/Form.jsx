import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProgressiForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    paziente_nome: '',
    data_misurazione: '',
    peso: '',
    massa_grassa: '',
    note: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:3001/api/progressi', {  // Assicurati che l'endpoint sia corretto
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        alert('Progresso registrato!');
        navigate('/progressi');
      })
      .catch(err => console.error('Errore:', err));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Registra Nuovo Progresso</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Paziente:</label><br />
          <input 
            type="text" 
            name="paziente_nome" 
            placeholder="Nome paziente" 
            value={formData.paziente_nome} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div>
          <label>Data rilevazione:</label><br />
          <input 
            type="date" 
            name="data_misurazione" 
            value={formData.data_misurazione} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div>
          <label>Peso (kg):</label><br />
          <input 
            type="number" 
            name="peso" 
            placeholder="Peso" 
            value={formData.peso} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div>
          <label>Percentuale massa grassa (%):</label><br />
          <input 
            type="number" 
            name="massa_grassa" 
            placeholder="Massa grassa" 
            value={formData.massa_grassa} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div>
          <label>Misure corporee (note):</label><br />
          <textarea 
            name="note" 
            placeholder="Es: vita, fianchi, coscia..." 
            value={formData.note} 
            onChange={handleChange} 
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            marginTop: '15px', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            padding: '8px 16px', 
            border: 'none', 
            cursor: 'pointer', 
            borderRadius: '5px' 
          }}
        >
          Salva progresso
        </button>
      </form>
    </div>
  );
};

export default ProgressiForm;
