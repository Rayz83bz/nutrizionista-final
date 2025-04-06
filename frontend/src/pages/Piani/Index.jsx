import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [piani, setPiani] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Endpoint corretto
    fetch("http://localhost:5000/api/piani")
      .then((res) => res.json())
      .then((data) => setPiani(data))
      .catch((err) => console.error("Errore nel recupero piani", err));
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Vuoi eliminare questo piano?")) {
      fetch(`http://localhost:5000/api/piani/${id}`, {
        method: "DELETE",
      })
        .then(() => {
          alert("Piano eliminato con successo.");
          setPiani((prev) => prev.filter((p) => p.id !== id));
        })
        .catch((err) => console.error("Errore durante l'eliminazione", err));
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📋 Piani Alimentari</h1>
      <button
        className="bg-green-600 text-white px-4 py-2 rounded mb-4 hover:bg-green-700"
        onClick={() => navigate("/piani/nuovo")}
      >
        ➕ Inserisci nuovo piano
      </button>
      <table className="w-full table-auto border-collapse border border-gray-300 shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Nome Piano</th>
            <th className="border p-2">Paziente</th>
            <th className="border p-2">Data Inizio</th>
            <th className="border p-2">Data Fine</th>
            <th className="border p-2">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {piani.length > 0 ? (
            piani.map((p) => (
              <tr key={p.id}>
                <td className="border p-2">{p.nome}</td>
                <td className="border p-2">
                  {p.paziente_nome && p.paziente_cognome
                    ? `${p.paziente_nome} ${p.paziente_cognome}`
                    : "Paziente non trovato"}
                </td>
                <td className="border p-2">{p.data_inizio || "-"}</td>
                <td className="border p-2">{p.data_fine || "-"}</td>
                <td className="border p-2 flex gap-2 justify-center">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    // Rotta al plurale
                    onClick={() => navigate(`/piani/dettagli/${p.id}`)}
                  >
                    📄 Dettagli
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    onClick={() => handleDelete(p.id)}
                  >
                    🗑️ Elimina
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center p-4 text-gray-500">
                Nessun piano alimentare trovato.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Index;
