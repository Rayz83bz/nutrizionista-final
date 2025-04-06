import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/global.css';

// Layout e contesto
import Layout from './components/Layout';

// Pagine principali
import Dashboard from './pages/Dashboard/Index';
import PazientiIndex from './pages/Pazienti/Index';
import PazienteForm from './components/PazienteForm';
import TabsPaziente from './pages/Pazienti/TabsPaziente';

// Dieta e database alimenti
import DietaPage from './pages/Dieta/Index';  // unico file, usato per tutto
import Alimenti from './pages/DatabaseAlimenti/Index';
import Ricette from './pages/Ricette/Index';
import Piani from './pages/Piani/Index';
import Progressi from './pages/Progressi/Index';
import Index from './pages/Dieta/Index';
import DietaForm from './pages/Dieta/Form';
import Dieta from './pages/Dieta/Index';

// Visite, fabbisogni e avanzati
import Fabbisogni from './pages/Fabbisogni/Fabbisogni'; // e non Index o Form
import DatiEvolutiviPaziente from './pages/DatiEvolutiviPaziente/DatiEvolutiviPaziente';

// Impostazioni
import Impostazioni from './pages/Impostazioni/Index';

// ✅ CONTEXT PAZIENTE
export const PazienteContext = createContext();

export const PazienteProvider = ({ children }) => {
  const [pazienteAttivo, setPazienteAttivo] = useState(null);

  // Carica da localStorage all'avvio
  useEffect(() => {
    const salvato = localStorage.getItem("pazienteAttivo");
    if (salvato) {
      try {
        setPazienteAttivo(JSON.parse(salvato));
      } catch (e) {
        console.warn("Errore parsing pazienteAttivo:", e);
      }
    }
  }, []);

  const seleziona = (paziente) => {
    setPazienteAttivo(paziente);
    localStorage.setItem("pazienteAttivo", JSON.stringify(paziente));
  };

  const deseleziona = () => {
    setPazienteAttivo(null);
    localStorage.removeItem("pazienteAttivo");
  };

  return (
    <PazienteContext.Provider value={{ pazienteAttivo, seleziona, deseleziona }}>
      {children}
    </PazienteContext.Provider>
  );
};

export const usePaziente = () => useContext(PazienteContext);

// ✅ ROUTER
function App() {
  return (
    <PazienteProvider>
      <Router>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* 📊 Dashboard iniziale */}
            <Route index element={<Dashboard />} />

            {/* 👥 Pazienti */}
            <Route path="/pazienti" element={<PazientiIndex />} />
            <Route path="/pazienti/nuovo" element={<PazienteForm />} />
            <Route path="/pazienti/:id/modifica" element={<PazienteForm />} />
            <Route path="/pazienti/:id" element={<TabsPaziente />} />

            {/* 🍽 Diete, alimenti e ricette */}
            <Route path="/alimenti" element={<Alimenti />} />
            <Route path="/ricette" element={<Ricette />} />
            <Route path="/piani" element={<Piani />} />
<Route path="/dieta/:id?" element={<Dieta />} />

            {/* 📈 Progressi e Visite */}
            <Route path="/progressi" element={<Progressi />} />

            {/* 🔬 Fabbisogni e dati avanzati */}
            <Route path="/fabbisogni" element={<Fabbisogni />} />
<Route path="/dati-evolutivi" element={<DatiEvolutiviPaziente />} />


            {/* ⚙️ Impostazioni */}
            <Route path="/impostazioni" element={<Impostazioni />} />
          </Route>
        </Routes>
      </Router>
    </PazienteProvider>
  );
}

export default App;
