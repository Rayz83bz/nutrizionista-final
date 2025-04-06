import { createContext, useContext, useEffect, useState } from "react";

// Creiamo il contesto
const PazienteContext = createContext();

// Hook per usare facilmente il contesto
export const usePaziente = () => useContext(PazienteContext);

// Provider da inserire in App.jsx
export const PazienteProvider = ({ children }) => {
  const [paziente, setPaziente] = useState(null);

  // Carica il paziente da localStorage all'avvio
  useEffect(() => {
    const salvato = localStorage.getItem("pazienteAttivo");
    if (salvato) {
      try {
        setPaziente(JSON.parse(salvato));
      } catch (e) {
        console.warn("Errore parsing pazienteAttivo:", e);
      }
    }
  }, []);

  const seleziona = (p) => {
    setPaziente(p);
    localStorage.setItem("pazienteAttivo", JSON.stringify(p));
  };

  const deseleziona = () => {
    setPaziente(null);
    localStorage.removeItem("pazienteAttivo");
  };

  return (
    <PazienteContext.Provider value={{ paziente, seleziona, deseleziona }}>
      {children}
    </PazienteContext.Provider>
  );
};
