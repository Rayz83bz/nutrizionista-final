import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { usePaziente } from "../../App";

export default function VisitePage() {
  const [searchParams] = useSearchParams();
  const idFromQuery = searchParams.get("for");

  const { pazienteAttivo } = usePaziente();
  const id_paziente = idFromQuery || pazienteAttivo?.id;

  const [visite, setVisite] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    data: "",
    peso: "",
    attivita_fisica: "",
    note: "",
  });

  useEffect(() => {
    if (id_paziente) {
      fetch(`http://localhost:5000/api/visite/paziente/${id_paziente}`)
        .then((res) => res.json())
        .then(setVisite)
        .catch(() => toast.error("Errore nel recupero delle visite"));
    }
  }, [id_paziente]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({
      id: null,
      data: "",
      peso: "",
      attivita_fisica: "",
      note: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const method = formData.id ? "PUT" : "POST";
    const url = formData.id
      ? `http://localhost:5000/api/visite/${formData.id}`
      : "http://localhost:5000/api/visite";

    const payload = {
      ...formData,
      id_paziente,
    };

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        toast.success(
          `Visita ${formData.id ? "modificata" : "inserita"} con successo`
        );
        if (!formData.id) {
          setVisite([data, ...visite]);
        } else {
          setVisite(
            visite.map((v) => (v.id === formData.id ? { ...v, ...formData } : v))
          );
        }
        resetForm();
      })
      .catch(() => toast.error("Errore nel salvataggio della visita"));
  };

  const handleDelete = async (id) => {
    // Check if the visita has a dieta
    const res = await fetch(`http://localhost:5000/api/diete/per-visita/${id}`);
    const diete = await res.json();

    if (diete.length > 0) {
      toast.error("Impossibile eliminare: dieta collegata a questa visita!");
      return;
    }

    if (window.confirm("Eliminare la visita?")) {
      fetch(`http://localhost:5000/api/visite/${id}`, { method: "DELETE" })
        .then(() => {
          setVisite(visite.filter((v) => v.id !== id));
          toast.success("Visita eliminata");
        })
        .catch(() => toast.error("Errore nell'eliminazione"));
    }
  };

  const handleEdit = (visita) => {
    setFormData({
      id: visita.id,
      data: visita.data,
      peso: visita.peso,
      attivita_fisica: visita.attivita_fisica || "",
      note: visita.note || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!id_paziente) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        ⚠️ Seleziona prima un paziente per gestire le visite
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">
        {formData.id ? "✏️ Modifica Visita" : "➕ Nuova Visita"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow mb-8"
      >
        <input
          type="date"
          name="data"
          value={formData.data}
          onChange={handleChange}
          required
          className="p-3 border rounded-xl"
        />
        <input
          type="number"
          name="peso"
          step="0.1"
          value={formData.peso}
          onChange={handleChange}
          placeholder="Peso (kg)"
          className="p-3 border rounded-xl"
        />
        <input
          type="text"
          name="attivita_fisica"
          value={formData.attivita_fisica}
          onChange={handleChange}
          placeholder="Attività fisica"
          className="p-3 border rounded-xl md:col-span-2"
        />
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Note cliniche o osservazioni"
          rows={3}
          className="p-3 border rounded-xl md:col-span-2"
        ></textarea>

        <div className="md:col-span-2 flex gap-3 mt-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700"
          >
            {formData.id ? "Salva modifiche" : "Aggiungi visita"}
          </button>
          {formData.id && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-xl"
            >
              Annulla
            </button>
          )}
        </div>
      </form>

      <h3 className="text-xl font-semibold mb-4 text-gray-800">🗂️ Storico Visite</h3>

      {visite.length === 0 ? (
        <p className="text-gray-500 italic">Nessuna visita registrata</p>
      ) : (
        <ul className="space-y-4">
          {visite.map((v) => (
            <li
              key={v.id}
              className="bg-white p-4 rounded-xl shadow flex justify-between items-start gap-4"
            >
              <div>
                <p className="text-sm text-gray-600">
                  <strong>📅 Data:</strong> {v.data}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>⚖️ Peso:</strong> {v.peso} kg
                </p>
                {v.attivita_fisica && (
                  <p className="text-sm text-gray-600">
                    <strong>🏃 Attività:</strong> {v.attivita_fisica}
                  </p>
                )}
                {v.note && (
                  <p className="text-sm text-gray-600">
                    <strong>📝 Note:</strong> {v.note}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleEdit(v)}
                  className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-800"
                >
                  ✏️ Modifica
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="text-sm px-3 py-1 rounded bg-red-100 text-red-800"
                >
                  🗑️ Elimina
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
