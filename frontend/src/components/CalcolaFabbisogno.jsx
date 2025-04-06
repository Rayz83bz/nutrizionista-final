import React, { useState } from "react";
import axios from "axios";

const CalcolaFabbisogno = () => {
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    age: "",
    sex: "",
    activityLevel: ""
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/pazienti/calcola-fabbisogno", formData);
      setResult(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Errore durante il calcolo.");
      setResult(null);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Calcola Fabbisogno Nutrizionale</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>Peso (kg): </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Altezza (cm): </label>
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Età: </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Sesso (M/F): </label>
          <select name="sex" value={formData.sex} onChange={handleChange} required>
            <option value="">Seleziona</option>
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Livello di attività: </label>
          <select
            name="activityLevel"
            value={formData.activityLevel}
            onChange={handleChange}
            required
          >
            <option value="">Seleziona</option>
            <option value="sedentary">Sedentario</option>
            <option value="lightly active">Leggermente attivo</option>
            <option value="moderately active">Moderatamente attivo</option>
            <option value="very active">Molto attivo</option>
            <option value="extra active">Estremamente attivo</option>
          </select>
        </div>
        <button type="submit">Calcola</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && (
        <div>
          <h2>Risultati:</h2>
          <p>BMR: {result.BMR} kcal</p>
          <p>TDEE: {result.TDEE} kcal</p>
          <h3>Macronutrienti:</h3>
          <p>Proteine: {result.macronutrients.protein} g</p>
          <p>Grassi: {result.macronutrients.fat} g</p>
          <p>Carboidrati: {result.macronutrients.carbs} g</p>
        </div>
      )}
    </div>
  );
};

export default CalcolaFabbisogno;
