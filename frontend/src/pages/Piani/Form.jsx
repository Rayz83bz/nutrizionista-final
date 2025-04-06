import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Form = () => {
  const navigate = useNavigate();
  const [pazienti, setPazienti] = useState([]);
  const [formData, setFormData] = useState({
    paziente_id: "",
    nome: "",
    descrizione: "",
    data_inizio: "",
    data_fine: "",
    peso: "",
    altezza: "",
    eta: "",
    sesso: "M",
    livello_attivita: "sedentario",
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/pazienti")
      .then((res) => res.json())
      .then((data) => setPazienti(data))
      .catch((err) => console.error("Errore nel caricamento pazienti", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Quando cambia la data_inizio, calcola anche la data_fine automaticamente
    if (name === "data_inizio") {
      const startDate = new Date(value);
      startDate.setDate(startDate.getDate() + 6);
      const dataFine = startDate.toISOString().split("T")[0];
      setFormData({ ...formData, [name]: value, data_fine: dataFine });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:5000/api/piani/nuovo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then(() => {
        alert("✅ Piano creato con successo!");
        navigate("/piani");
      })
      .catch((err) => console.error("Errore nella creazione piano", err));
  };

  return (
    <div style={{ maxWidth: "600px", margin: "30px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2>Crea un nuovo piano alimentare</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        <div>
          <label>Seleziona Paziente</label>
          <select
            name="paziente_id"
            value={formData.paziente_id}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="">-- Seleziona --</option>
            {pazienti.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} {p.cognome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Nome piano</label>
          <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
        </div>

        <div>
          <label>Descrizione</label>
          <input type="text" name="descrizione" value={formData.descrizione} onChange={handleChange} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div>
            <label>Data inizio</label>
            <input type="date" name="data_inizio" value={formData.data_inizio} onChange={handleChange} required />
          </div>
          <div>
            <label>Data fine (calcolata)</label>
            <input type="date" name="data_fine" value={formData.data_fine} onChange={handleChange} required />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div>
            <label>Peso (kg)</label>
            <input type="number" name="peso" value={formData.peso} onChange={handleChange} step="0.1" required />
          </div>
          <div>
            <label>Altezza (cm)</label>
            <input type="number" name="altezza" value={formData.altezza} onChange={handleChange} required />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <div>
            <label>Età</label>
            <input type="number" name="eta" value={formData.eta} onChange={handleChange} required />
          </div>
          <div>
            <label>Sesso</label>
            <select
              name="sesso"
              value={formData.sesso}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            >
              <option value="M">Maschio</option>
              <option value="F">Femmina</option>
            </select>
          </div>
        </div>

        <div>
          <label>Livello attività</label>
          <select
            name="livello_attivita"
            value={formData.livello_attivita}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="sedentario">Sedentario</option>
            <option value="leggermente attivo">Leggermente attivo</option>
            <option value="moderatamente attivo">Moderatamente attivo</option>
            <option value="molto attivo">Molto attivo</option>
            <option value="estremamente attivo">Estremamente attivo</option>
          </select>
        </div>

        <button type="submit" style={{ padding: "10px", marginTop: "10px" }}>
          Crea piano
        </button>
      </form>
    </div>
  );
};

export default Form;
