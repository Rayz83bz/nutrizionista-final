import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const Dettagli = () => {
  const { id } = useParams();
  const [piano, setPiano] = useState(null);
  const [giorni, setGiorni] = useState([]);
  const [alimenti, setAlimenti] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPasto, setSelectedPasto] = useState(null);

  // Uso useCallback per memorizzare fetchDettagli e includerlo nelle dipendenze
  const fetchDettagli = useCallback(() => {
    axios
      .get(`http://localhost:5000/api/piani/${id}/dettagli`)
      .then((response) => {
        setPiano(response.data.piano);
        setGiorni(response.data.giorni);
      })
      .catch((err) => console.error("Errore nel caricamento dettagli:", err));
  }, [id]);

  useEffect(() => {
    fetchDettagli();
  }, [fetchDettagli]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/database-alimenti")
      .then((response) => setAlimenti(response.data))
      .catch((err) =>
        console.error("Errore nel caricamento alimenti:", err)
      );
  }, []);

  const aggiungiAlimento = (alimentoId, quantita) => {
    if (!selectedPasto) return;
    axios
      .post(`http://localhost:5000/api/piani/${id}/aggiungi-alimento`, {
        piano_pasto_id: selectedPasto,
        alimento_id: alimentoId,
        quantita,
      })
      .then(() => {
        alert("✅ Alimento aggiunto!");
        setShowModal(false);
        fetchDettagli(); // Ricarica i dettagli
      })
      .catch((err) =>
        console.error("Errore nell'aggiunta dell'alimento:", err)
      );
  };

  const eliminaAlimento = (alimentoPastoId) => {
    if (window.confirm("Vuoi davvero rimuovere questo alimento?")) {
      axios
        .delete(`http://localhost:5000/api/piani/elimina-alimento/${alimentoPastoId}`)
        .then(() => {
          alert("Alimento rimosso");
          fetchDettagli();
        })
        .catch((err) =>
          console.error("Errore eliminazione alimento:", err)
        );
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {piano && (
        <>
          <h1>
            {piano.nome} - {piano.data_inizio} → {piano.data_fine}
          </h1>
          <p>{piano.descrizione}</p>

          {giorni.map((giorno) => {
            const calorieTotaliGiorno = giorno.pasti.reduce((tot, pasto) =>
              tot +
              pasto.alimenti.reduce(
                (acc, al) => acc + (al.energia_kcal * al.quantita) / 100,
                0
              ),
              0
            );

            return (
              <div
                key={giorno.id}
                style={{
                  border: "1px solid #ccc",
                  margin: "15px 0",
                  padding: "10px",
                  borderRadius: "8px",
                }}
              >
                <h2>
                  Giorno {giorno.giorno_index} - Totale kcal:{" "}
                  {calorieTotaliGiorno.toFixed(1)}
                </h2>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  {giorno.pasti.map((pasto) => (
                    <div
                      key={pasto.id}
                      style={{
                        border: "1px solid #ddd",
                        padding: "10px",
                        width: "250px",
                        borderRadius: "6px",
                        background: "#fafafa",
                      }}
                    >
                      <h3>{pasto.tipo_pasto}</h3>
                      <ul>
                        {pasto.alimenti &&
                          pasto.alimenti.map((al) => (
                            <li
                              key={al.alimento_pasto_id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span>
                                {al.nomeAlimento} - {al.quantita}g
                                <br />
                                <small>
                                  ({((al.energia_kcal * al.quantita) / 100).toFixed(1)} kcal)
                                </small>
                              </span>
                              <button
                                style={{
                                  backgroundColor: "red",
                                  color: "white",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  eliminaAlimento(al.alimento_pasto_id)
                                }
                              >
                                ❌
                              </button>
                            </li>
                          ))}
                      </ul>
                      <button
                        style={{
                          marginTop: "5px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSelectedPasto(pasto.id);
                          setShowModal(true);
                        }}
                      >
                        ➕ Aggiungi Alimento
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {showModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  margin: "5% auto",
                  padding: "20px",
                  width: "70%",
                  borderRadius: "10px",
                }}
              >
                <h2>Seleziona un alimento da aggiungere</h2>
                <ul
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto",
                    listStyle: "none",
                    padding: "0",
                  }}
                >
                  {alimenti.map((alimento) => (
                    <li
                      key={alimento.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span>{alimento.nome}</span>
                      <button
                        onClick={() => {
                          const q = prompt(
                            `Quantità in grammi per ${alimento.nome}:`
                          );
                          if (q && !isNaN(parseFloat(q))) {
                            aggiungiAlimento(alimento.id, parseFloat(q));
                          }
                        }}
                      >
                        ➕ Aggiungi
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ marginTop: "10px" }}
                >
                  Chiudi
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dettagli;
