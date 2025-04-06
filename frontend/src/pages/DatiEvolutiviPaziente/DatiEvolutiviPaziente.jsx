import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { FaFilePdf, FaFilter, FaCopy } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const defaultLayout = [
  { i: 'datiVisita', x: 0, y: 0, w: 2, h: 4 },
  { i: 'clinica', x: 0, y: 1, w: 2, h: 6 },
  { i: 'grafici', x: 0, y: 2, w: 2, h: 5 },
  { i: 'storico', x: 0, y: 3, w: 2, h: 6 }
];

export default function DatiEvolutiviPaziente() {
  const location = useLocation();
  const pdfRef = useRef();

  const [layout, setLayout] = useState(() =>
    JSON.parse(localStorage.getItem('layout-evolutivo')) || defaultLayout
  );
  const [pazienteAttivo, setPazienteAttivo] = useState(null);
  const [visite, setVisite] = useState([]);
  const [fabbisogni, setFabbisogni] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [parametriGrafico, setParametriGrafico] = useState(['peso', 'glicemia']);
  const [filtroDataInizio, setFiltroDataInizio] = useState('');
  const [filtroDataFine, setFiltroDataFine] = useState('');

  const [dati, setDati] = useState({
    id: null, data: '', peso: '', attivita_fisica: '',
    glicemia: '', colesterolo: '', colesteroloHDL: '', colesteroloLDL: '',
    trigliceridi: '', emoglobina: '', ematocrito: '', azotemia: '',
    vitaminaD: '', vitaminaB12: '', tsh: '', note: '',
    vegano: false, vegetariano: false, no_lattosio: false, senza_glutine: false,
    int_glutine: false, int_lattosio: false, int_frutta: false,
    circonferenza_vita: '', circonferenza_fianchi: '', circonferenza_torace: '',
    circonferenza_polso_dx: '', circonferenza_polso_sx: '',
    braccio_dx: '', braccio_sx: '', avambraccio_dx: '', avambraccio_sx: '',
    costituzione: '', biotipo: '',
    grasso_viscerale: '', massa_grassa: '', grasso_sottocutaneo: '',
    ferritina: '', vcm: '', piastrine: '', eritrociti: '', leucociti: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('pazienteAttivo');
    if (stored) {
      try {
        setPazienteAttivo(JSON.parse(stored));
      } catch {
        setPazienteAttivo(null);
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const forId = params.get('for');
    if (forId && !pazienteAttivo) {
      fetch(`http://localhost:5000/api/pazienti/${forId}`)
        .then(res => res.json())
        .then(data => {
          localStorage.setItem('pazienteAttivo', JSON.stringify(data));
          setPazienteAttivo(data);
        })
        .catch(err => {
          console.error("Errore caricamento paziente da ID:", err);
          alert("❌ Errore nel caricamento del paziente");
        });
    }
  }, [location.search, pazienteAttivo]);

  useEffect(() => {
    if (pazienteAttivo?.id) {
      fetch(`http://localhost:5000/api/dati-avanzati/${pazienteAttivo.id}`)
        .then(res => res.json())
        .then(data => setVisite(data));

      fetch(`http://localhost:5000/api/fabbisogni/${pazienteAttivo.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setFabbisogni(data[data.length - 1]);
          }
        });
    }
  }, [pazienteAttivo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDati(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const salvaDati = async () => {
    if (!dati.data || !dati.peso || !dati.attivita_fisica) {
      alert('⚠️ Inserisci almeno data, peso e attività fisica');
      return;
    }

    const payload = { ...dati, id_paziente: pazienteAttivo.id };
    const method = dati.id ? 'PUT' : 'POST';
    const endpoint = dati.id
      ? `http://localhost:5000/api/dati-avanzati/${dati.id}`
      : 'http://localhost:5000/api/dati-avanzati';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Errore salvataggio visita");

      alert(dati.id ? "✅ Visita aggiornata!" : "✅ Visita salvata!");

      setDati(prev => ({
        ...prev,
        id: null,
        data: '', peso: '', attivita_fisica: '',
        glicemia: '', colesterolo: '', colesteroloHDL: '', colesteroloLDL: '',
        trigliceridi: '', emoglobina: '', ematocrito: '', azotemia: '',
        vitaminaD: '', vitaminaB12: '', tsh: '', note: '',
        vegano: false, vegetariano: false, no_lattosio: false, senza_glutine: false,
        int_glutine: false, int_lattosio: false, int_frutta: false,
        circonferenza_vita: '', circonferenza_fianchi: '', circonferenza_torace: '',
        circonferenza_polso_dx: '', circonferenza_polso_sx: '',
        braccio_dx: '', braccio_sx: '', avambraccio_dx: '', avambraccio_sx: '',
        costituzione: '', biotipo: '',
        grasso_viscerale: '', massa_grassa: '', grasso_sottocutaneo: '',
        ferritina: '', vcm: '', piastrine: '', eritrociti: '', leucociti: ''
      }));

      const updated = await fetch(`http://localhost:5000/api/dati-avanzati/${pazienteAttivo.id}`).then(r => r.json());
      setVisite(updated);
    } catch (err) {
      console.error("Dettaglio errore:", err);
      alert("❌ Errore durante il salvataggio: " + err.message);
    }
  };
  if (!pazienteAttivo) {
    return <div className="p-6 text-gray-500">⏳ Caricamento paziente...</div>;
  }

  const allargaTutto = () => {
    const updated = layout.map(b => ({ ...b, w: 2, h: 6 }));
    setLayout(updated);
    localStorage.setItem('layout-evolutivo', JSON.stringify(updated));
  };

  const minimizza = () => {
    const updated = layout.map(b => ({ ...b, w: 1, h: 3 }));
    setLayout(updated);
    localStorage.setItem('layout-evolutivo', JSON.stringify(updated));
  };
  
  
  
  
  
  
  const altezza = pazienteAttivo?.altezza;
const bmi = altezza ? (dati.peso / ((altezza / 100) ** 2)).toFixed(2) : null;
const pesoIdeale = altezza ? (altezza - 100 - (altezza - 150) / 2).toFixed(1) : null;

const RIFERIMENTI = {
  emoglobina: { min: 13.5, max: 17.5, unit: 'g/dL' },
  ematocrito: { min: 40, max: 52, unit: '%' },
  eritrociti: { min: 4.5, max: 5.9, unit: 'milioni/μL' },
  leucociti: { min: 4, max: 11, unit: 'migliaia/μL' },
  piastrine: { min: 150, max: 450, unit: 'migliaia/μL' },
  vcm: { min: 80, max: 100, unit: 'fL' },
  ferritina: { min: 30, max: 300, unit: 'ng/mL' }
};

const filtraVisite = () => {
  if (!filtroDataInizio && !filtroDataFine) return visite;
  return visite.filter(v => {
    const data = new Date(v.data);
    const inizio = filtroDataInizio ? new Date(filtroDataInizio) : null;
    const fine = filtroDataFine ? new Date(filtroDataFine) : null;
    return (!inizio || data >= inizio) && (!fine || data <= fine);
  });
};

const parametriDisponibili = [
  { key: "peso", label: "Peso (kg)" },
  { key: "glicemia", label: "Glicemia" },
  { key: "colesterolo", label: "Colesterolo Totale" },
  { key: "colesteroloHDL", label: "HDL" },
  { key: "colesteroloLDL", label: "LDL" },
  { key: "trigliceridi", label: "Trigliceridi" }
];

const toggleParametroGrafico = (key) => {
  setParametriGrafico(prev =>
    prev.includes(key)
      ? prev.filter(p => p !== key)
      : [...prev, key]
  );
};

const dataGrafico = {
  labels: filtraVisite().map(v => v.data),
  datasets: parametriGrafico.map((key, i) => ({
    label: parametriDisponibili.find(p => p.key === key)?.label || key,
    data: filtraVisite().map(v => parseFloat(v[key]) || 0),
    borderColor: `hsl(${(i * 60) % 360}, 70%, 50%)`,
    fill: false,
    tension: 0.3
  }))
};

const esportaPDF = async () => {
  const input = pdfRef.current;
  const canvas = await html2canvas(input);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF();
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`storico_${pazienteAttivo.nome}_${pazienteAttivo.cognome}.pdf`);
};

const duplicaVisita = async (visita) => {
  const nuova = {
    ...visita,
    id: undefined,
    data: new Date().toISOString().split("T")[0],
    id_paziente: pazienteAttivo.id
  };

  try {
    const res = await fetch('http://localhost:5000/api/dati-avanzati', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuova)
    });

    if (!res.ok) throw new Error("Errore duplicazione");

    alert("✅ Visita duplicata!");
    const updated = await fetch(`http://localhost:5000/api/dati-avanzati/${pazienteAttivo.id}`).then(r => r.json());
    setVisite(updated);
  } catch (err) {
    console.error(err);
    alert("❌ Errore duplicazione visita");
  }
};

const eliminaVisita = async (id) => {
  if (!window.confirm('Vuoi davvero eliminare questa visita?')) return;

  try {
    const res = await fetch(`http://localhost:5000/api/dati-avanzati/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Errore eliminazione');

    alert('✅ Visita eliminata');
    const aggiornate = await fetch(`http://localhost:5000/api/dati-avanzati/${pazienteAttivo.id}`).then(r => r.json());
    setVisite(aggiornate);
  } catch (err) {
    console.error(err);
    alert('❌ Errore durante l\'eliminazione');
  }
};

const iniziaModifica = (visita) => {
  setDati(visita);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const calcolaFabbisogni = async () => {
  if (!pazienteAttivo?.id) return;
  try {
    const res = await fetch(`http://localhost:5000/api/fabbisogni/calcola/${pazienteAttivo.id}`, { method: 'POST' });
    if (!res.ok) throw new Error('Errore calcolo automatico');
    alert('✅ Fabbisogni calcolati automaticamente');
  } catch (err) {
    console.error(err);
    alert("❌ Errore nel calcolo automatico dei fabbisogni");
  }
};




  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">
        Dati Evolutivi – {pazienteAttivo.nome?.toUpperCase()} {pazienteAttivo.cognome?.toUpperCase()}
      </h1>
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={allargaTutto} className="bg-gray-100 text-sm px-3 py-1 rounded">🖥 Allarga</button>
        <button onClick={minimizza} className="bg-gray-100 text-sm px-3 py-1 rounded">🗂 Riduci</button>
        <button onClick={salvaDati} className="bg-blue-600 text-white px-4 py-1 rounded">
          💾 {dati.id ? 'Salva Modifica' : 'Salva Visita'}
        </button>
        <button onClick={calcolaFabbisogni} className="bg-green-600 text-white px-4 py-1 rounded">
          ⚙️ Calcola Fabbisogni
        </button>
        <button onClick={esportaPDF} className="bg-red-600 text-white px-4 py-1 rounded">
          <FaFilePdf className="inline mr-1" /> Esporta PDF
        </button>
        {dati.id && (
          <>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm font-semibold">
              ✏️ MODIFICA ATTIVA
            </span>
            <button
              onClick={() => setDati(prev => ({
                ...prev,
                id: null, data: '', peso: '', attivita_fisica: '', note: ''
              }))}
              className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
            >
              ❌ Annulla Modifica
            </button>
          </>
        )}
      </div>

      <GridLayout
        className="layout"
        layout={layout}
        cols={2}
        rowHeight={70}
        width={1200}
        onLayoutChange={(l) => {
          setLayout(l);
          localStorage.setItem('layout-evolutivo', JSON.stringify(l));
        }}
        draggableHandle=".drag-title"
        isResizable
      >
        {/* 1. INSERIMENTO VISITA */}
        <div key="datiVisita" data-grid={{ x: 0, y: 0, w: 2, h: 4 }} className="bg-white p-4 rounded shadow overflow-auto">
          <h2 className="font-semibold text-lg drag-title cursor-move mb-4">📅 Inserimento nuova visita</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label>Data</label>
              <input type="date" name="data" value={dati.data} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label>Peso (kg)</label>
              <input type="number" name="peso" value={dati.peso} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label>Attività fisica</label>
              <select name="attivita_fisica" value={dati.attivita_fisica} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="">-- Seleziona --</option>
                <option value="sedentario">Sedentario</option>
                <option value="leggero">Leggero</option>
                <option value="moderato">Moderato</option>
                <option value="intenso">Intenso</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. PARAMETRI CLINICI – segue nella Parte 4 */}
        {/* 2. PARAMETRI CLINICI */}
        <div key="clinica" data-grid={{ x: 0, y: 1, w: 2, h: 6 }} className="bg-white p-4 rounded shadow overflow-auto">
          <h2 className="font-semibold text-lg drag-title cursor-move mb-4">📌 Parametri Clinici e Antropometrici</h2>

          <div className="flex gap-2 mb-4 text-sm">
            {["Antropometrici", "Circonferenze", "Costituzione", "Emocromo"].map((label, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-1 rounded-full transition-all ${
                  activeTab === i
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* TAB 1: Antropometrici */}
          {activeTab === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><label className="font-medium">Altezza</label><div className="p-2 border rounded bg-gray-100">{pazienteAttivo.altezza} cm</div></div>
              <div><label className="font-medium">Peso</label><div className="p-2 border rounded bg-gray-100">{dati.peso || '-'} kg</div></div>
              <div><label className="font-medium">BMI</label><div className="p-2 border rounded bg-gray-100">{bmi}</div></div>
              <div><label className="font-medium">Peso ideale</label><div className="p-2 border rounded bg-gray-100">{pesoIdeale} kg</div></div>
            </div>
          )}

          {/* TAB 2: Circonferenze */}
          {activeTab === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><label>Vita (cm)</label><input name="circonferenza_vita" value={dati.circonferenza_vita} onChange={handleChange} className="border p-2 rounded w-full" /></div>
              <div><label>Fianchi (cm)</label><input name="circonferenza_fianchi" value={dati.circonferenza_fianchi} onChange={handleChange} className="border p-2 rounded w-full" /></div>
              <div><label>Torace (cm)</label><input name="circonferenza_torace" value={dati.circonferenza_torace} onChange={handleChange} className="border p-2 rounded w-full" /></div>
              <div><label>Polso DX (cm)</label><input name="circonferenza_polso_dx" value={dati.circonferenza_polso_dx} onChange={handleChange} className="border p-2 rounded w-full" /></div>
              <div><label>Polso SX (cm)</label><input name="circonferenza_polso_sx" value={dati.circonferenza_polso_sx} onChange={handleChange} className="border p-2 rounded w-full" /></div>
            </div>
          )}

          {/* TAB 3: Costituzione */}
          {activeTab === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><label>Costituzione</label><input name="costituzione" value={dati.costituzione} onChange={handleChange} className="border p-2 rounded w-full" /></div>
              <div><label>Biotipo</label><input name="biotipo" value={dati.biotipo} onChange={handleChange} className="border p-2 rounded w-full" /></div>
            </div>
          )}

          {/* TAB 4: Emocromo */}
          {activeTab === 3 && (
            <div className="overflow-x-auto text-sm">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2 border">Parametro</th>
                    <th className="text-left px-3 py-2 border">Valore</th>
                    <th className="text-left px-3 py-2 border">Unità</th>
                    <th className="text-left px-3 py-2 border">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(RIFERIMENTI).map(([key, ref]) => {
                    const value = parseFloat(dati[key]);
                    const colorClass = isNaN(value)
                      ? 'text-gray-500'
                      : value < ref.min
                      ? 'text-yellow-600 font-semibold'
                      : value > ref.max
                      ? 'text-red-600 font-semibold'
                      : 'text-green-600 font-semibold';
                    return (
                      <tr key={key} className="border-b">
                        <td className="px-3 py-1 border capitalize">{key}</td>
                        <td className={`px-3 py-1 border ${colorClass}`}>
                          <input
                            type="text"
                            name={key}
                            value={dati[key]}
                            onChange={handleChange}
                            className="w-24 border px-2 py-1 rounded text-right"
                          />
                        </td>
                        <td className="px-3 py-1 border text-gray-600">{ref.unit}</td>
                        <td className="px-3 py-1 border text-gray-500">{ref.min} – {ref.max}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* 3. GRAFICO EVOLUTIVO */}
        <div key="grafici" data-grid={{ x: 0, y: 2, w: 2, h: 5 }} className="bg-white p-4 rounded shadow overflow-auto">
          <h2 className="font-semibold text-lg drag-title cursor-move mb-4">📈 Grafico evolutivo</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {parametriDisponibili.map(p => (
              <label key={p.key} className="text-sm bg-gray-100 px-2 py-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={parametriGrafico.includes(p.key)}
                  onChange={() => toggleParametroGrafico(p.key)}
                  className="mr-1"
                />
                {p.label}
              </label>
            ))}
            <div className="ml-auto flex gap-2">
              <input
                type="date"
                value={filtroDataInizio}
                onChange={(e) => setFiltroDataInizio(e.target.value)}
                className="text-sm border rounded p-1"
              />
              <input
                type="date"
                value={filtroDataFine}
                onChange={(e) => setFiltroDataFine(e.target.value)}
                className="text-sm border rounded p-1"
              />
              <button
                onClick={() => {
                  setFiltroDataInizio('');
                  setFiltroDataFine('');
                }}
                className="text-sm text-blue-500"
              >
                <FaFilter className="inline mr-1" />Reset
              </button>
            </div>
          </div>
          <Line data={dataGrafico} />
        </div>
        {/* 4. STORICO VISITE */}
        <div
          key="storico"
          data-grid={{ x: 0, y: 3, w: 2, h: 6 }}
          className="bg-white p-4 rounded shadow overflow-auto"
          ref={pdfRef}
        >
          <h2 className="font-semibold text-lg drag-title cursor-move mb-4">🗃 Storico visite registrate</h2>

          <div className="space-y-3 text-sm">
            {filtraVisite().map((v, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <strong>{v.data}</strong> – {v.peso} kg
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button onClick={() => duplicaVisita(v)} className="text-blue-600 text-xs hover:underline">
                      <FaCopy className="inline mr-1" />Duplica
                    </button>
                    <button
                      onClick={() => {
                        const url = `/dieta/${pazienteAttivo.id}?fromVisita=${v.id}`;
                        window.location.href = url;
                      }}
                      className="text-green-600 text-xs hover:underline"
                    >
                      📅 Crea dieta da questa visita
                    </button>
                    <button onClick={() => iniziaModifica(v)} className="text-purple-600 text-xs hover:underline">
                      ✏️ Modifica
                    </button>
                    <button onClick={() => eliminaVisita(v.id)} className="text-red-500 text-xs hover:underline">
                      🗑 Elimina
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                  <div>Attività: {v.attivita_fisica}</div>
                  <div>Glicemia: {v.glicemia}</div>
                  <div>Colesterolo Totale: {v.colesterolo}</div>
                  <div>HDL: {v.colesteroloHDL}</div>
                  <div>LDL: {v.colesteroloLDL}</div>
                  <div>Trigliceridi: {v.trigliceridi}</div>
                </div>

                {v.note && (
                  <div className="mt-2 italic text-gray-600">📝 {v.note}</div>
                )}

                {fabbisogni && (
                  <div className="mt-2 text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                    <strong>Fabbisogni:</strong> {fabbisogni.fabbisogno_calorico} kcal – {fabbisogni.proteine}g P – {fabbisogni.grassi}g G – {fabbisogni.carboidrati}g C
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </GridLayout>
    </div>
  );
}
