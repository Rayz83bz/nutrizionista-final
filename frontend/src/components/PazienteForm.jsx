import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function PazienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    codice_fiscale: "",
    altezza: "",
  });

  const [savedId, setSavedId] = useState(null);
  const [pazienteAttivo, setPazienteAttivo] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:5000/api/pazienti/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Errore nel caricamento");
          return res.json();
        })
        .then((data) => {
          setFormData(data);
          setSavedId(data.id);
          setPazienteAttivo(data);
          localStorage.setItem("pazienteAttivo", JSON.stringify(data));
        })
        .catch((err) => {
          toast.error("Errore nel caricamento del paziente.");
          console.error(err);
        });
    } else {
      const attivo = JSON.parse(localStorage.getItem("pazienteAttivo"));
      if (attivo?.id) {
        setPazienteAttivo(attivo);
      }
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.codice_fiscale) {
      toast.error("Codice fiscale obbligatorio!");
      return;
    }

    const url = id
      ? `http://localhost:5000/api/pazienti/${id}`
      : "http://localhost:5000/api/pazienti";

    const method = id ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          toast.success(`Paziente ${id ? "aggiornato" : "creato"} con successo!`);

          const nuovoId = id || data.id;
          const pazienteFinale = { ...formData, id: nuovoId };

          localStorage.setItem("pazienteAttivo", JSON.stringify(pazienteFinale));
          setSavedId(nuovoId);
          setPazienteAttivo(pazienteFinale);

          // 🔁 Dopo salvataggio torni alla lista
          navigate("/pazienti");
        } else {
          throw new Error(data.message || "Errore nel salvataggio.");
        }
      })
      .catch((error) => {
        toast.error("Errore nel salvataggio del paziente.");
        console.error(error);
      });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-3xl mx-auto">
      {pazienteAttivo && (
        <div className="mb-6 bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm flex items-center justify-between border border-blue-200">
          <span>
            <strong>Paziente attivo:</strong>{" "}
            {pazienteAttivo.nome?.toUpperCase()} {pazienteAttivo.cognome?.toUpperCase()}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem("pazienteAttivo");
              setPazienteAttivo(null);
            }}
            className="text-red-600 hover:text-red-800 ml-4 text-sm"
          >
            ❌ Deseleziona
          </button>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4">
        {id ? "Modifica Paziente" : "Nuovo Paziente"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input
          type="text"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          placeholder="Nome"
          required
          className="p-3 border rounded-xl"
        />
        <input
          type="text"
          name="cognome"
          value={formData.cognome}
          onChange={handleChange}
          placeholder="Cognome"
          required
          className="p-3 border rounded-xl"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="p-3 border rounded-xl"
        />
        <input
          type="text"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          placeholder="Telefono"
          className="p-3 border rounded-xl"
        />
        <input
          type="text"
          name="codice_fiscale"
          value={formData.codice_fiscale}
          onChange={handleChange}
          placeholder="Codice Fiscale"
          required
          className="p-3 border rounded-xl"
        />
        <input
          type="number"
          name="altezza"
          value={formData.altezza}
          onChange={handleChange}
          placeholder="Altezza (cm)"
          className="p-3 border rounded-xl"
        />

        <div className="col-span-2">
          <button
            type="submit"
            className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition w-full"
          >
            {id ? "Salva modifiche" : "Aggiungi paziente"}
          </button>
        </div>
      </form>
    </div>
  );
}
