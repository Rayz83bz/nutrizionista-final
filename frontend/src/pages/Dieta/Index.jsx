// src/pages/Dieta/Index.jsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
//import { suggerisciAlimenti } from '../../utils/dietaUtils';

import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const pasti = ['Colazione', 'Spuntino Mattutino', 'Pranzo', 'Spuntino Pomeridiano', 'Cena'];
const giorniDefault = ['Giorno 1', 'Giorno 2', 'Giorno 3', 'Giorno 4', 'Giorno 5', 'Giorno 6', 'Giorno 7', 'Fabbisogno'];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function Index() {
  const { id } = useParams();
  const location = useLocation();
const edit = new URLSearchParams(location.search).get('edit');
const nuova = new URLSearchParams(location.search).get('nuova');
  const navigate = useNavigate();
  useEffect(() => {
  if (id && !edit && !nuova) {
    // Se stai entrando direttamente nella dieta (es. /dieta/9) e non c'è già un edit o nuova
    navigate(`/dieta?edit=${id}`, { replace: true });
  }
}, [id, edit, nuova, navigate]);

  const fromVisita = new URLSearchParams(location.search).get('fromVisita');

const [peso, setPeso] = useState(null);
const [tabAttivo, setTabAttivo] = useState(0);
const [modificaPeso, setModificaPeso] = useState(false);
const [sidebarAperta, setSidebarAperta] = useState(true);

  const [foods, setFoods] = useState([]);
  const [visitaCollegata, setVisitaCollegata] = useState(null);
  const [dieta, setDieta] = useState(giorniDefault.map(() => pasti.map(() => [])));
  const [searchValues, setSearchValues] = useState(giorniDefault.map(() => pasti.map(() => '')));
  const [gramInput, setGramInput] = useState({});
  const [openMeals, setOpenMeals] = useState(giorniDefault.map(() => pasti.map(() => false)));
  const [dietaSelezionata, setDietaSelezionata] = useState(null);
  const [fabbisogni, setFabbisogni] = useState(null);
  const [selectedPaziente, setSelectedPaziente] = useState(null);
  const [layout, setLayout] = useState(
    JSON.parse(localStorage.getItem('dietaLayout')) ||
      giorniDefault.map((_, i) => ({ i: String(i), x: i % 4, y: Math.floor(i / 4), w: 1, h: 6, minW: 1, minH: 4 }))
  );
  const [dieteSalvate, setDieteSalvate] = useState([]);
  const [showDieteSalvate, setShowDieteSalvate] = useState(false);
  const [nomeDieta, setNomeDieta] = useState('');
const [modificaAttiva, setModificaAttiva] = useState(false);
const [modalitaCompatta, setModalitaCompatta] = useState(
  localStorage.getItem('modalitaCompatta') === 'true'
);
const [sidebarCollassata, setSidebarCollassata] = useState(
  localStorage.getItem('sidebarCollassata') === 'true'
);
useEffect(() => {
  localStorage.setItem('sidebarCollassata', sidebarCollassata);
}, [sidebarCollassata]);


  useEffect(() => {
if (!fromVisita && !edit && !nuova && location.pathname === '/dieta') {
  navigate('/dieta?nuova=1');
}

  }, [fromVisita, edit, navigate]);

useEffect(() => {
  localStorage.setItem('modalitaCompatta', modalitaCompatta);
}, [modalitaCompatta]);


  useEffect(() => {
    const salvato = localStorage.getItem('pazienteAttivo');
    const paziente = salvato ? JSON.parse(salvato) : null;

    if (!paziente || !paziente.id) {
      alert('⚠️ Devi selezionare un paziente attivo per proseguire.');
      return;
    }

    setSelectedPaziente(paziente);
    if (fromVisita) {
      fetch(`http://localhost:5000/api/visite/${fromVisita}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.visita) {
            setVisitaCollegata(data.visita);
          }
        })
        .catch(err => console.error('❌ Errore caricamento visita collegata:', err));
    }

    fetch('http://localhost:5000/api/database-alimenti')
      .then(res => res.json())
      .then(data => setFoods(data))
      .catch(err => console.error("Errore alimenti:", err));

    fetchDieteSalvate(paziente.id);
  }, []);

  useEffect(() => {
    if (edit) {
      fetch(`http://localhost:5000/api/diete/dettaglio/${edit}`)
        .then(res => res.json())
        .then(res => {
          if (!res.success || !res.data || !res.data.giorni) {
            alert('❌ Questa dieta non contiene dati validi');
            return;
          }
          const nuovaDieta = res.data.giorni.map(g => g.pasti.map(p => p.alimenti));
          setDieta(nuovaDieta);
          setDietaSelezionata({ id: res.data.id, nome_dieta: res.data.nome });
          if ('peso' in res.data) setPeso(res.data.peso);
setNomeDieta(res.data.nome);
          // Carica fabbisogni
          fetch(`http://localhost:5000/api/diete/fabbisogni/${res.data.id}`)
            .then(r => r.json())
            .then(fab => {
              if (fab && fab.fabbisogno_calorico) {
                setFabbisogni(fab);
              } else {
                fetch(`http://localhost:5000/api/diete/fabbisogni/calcola/${res.data.id}`, {
                  method: 'POST'
                })
                  .then(r => r.json())
                  .then(res => {
                    if (res && res.fabbisogno_calorico) {
                      setFabbisogni(res);
                    } else {
                      alert('❌ Calcolo fabbisogni fallito.');
                    }
                  });
              }
            })
            .catch(err => {
              console.error('❌ Errore fabbisogni:', err);
              alert('❌ Errore durante il recupero dei fabbisogni.');
            });
        })
        .catch(err => {
          console.error('❌ Errore caricamento dieta da ID:', err);
          alert('❌ Errore durante il caricamento della dieta.');
        });
    }
  }, [edit]);

const fetchDieteSalvate = (id) => {
  fetch(`http://localhost:5000/api/diete/${id}`)
    .then(res => res.json())
    .then(data => {
      console.log('📦 Risposta grezza dal backend:', data);

if (!data.success || !Array.isArray(data.diete)) {
  console.warn('⚠️ Nessuna dieta trovata o formato errato:', data);
  setDieteSalvate([]); // fallback a lista vuota
  return;
}


      if (data.diete.length === 0) {
        alert('⚠️ Nessuna dieta trovata per questo paziente.');
      }

      setDieteSalvate(data.diete);
    })
    .catch(err => {
      console.error('❌ Errore fetch diete:', err);
      alert('❌ Errore rete nel caricamento delle diete.');
    });
};
const handleAddFood = (giornoIndex, pastoIndex, alimento) => {
const quantitaVal = parseFloat(gramInput[`${giornoIndex}-${pastoIndex}-${alimento.id}`]) || 100;
if (isNaN(quantitaVal) || quantitaVal <= 0) {
  toast.error('Inserisci una quantità valida');
  return;
}

const rapporto = quantitaVal / 100;

const alimentoModificato = {
  id: alimento.id, // ID originale dal DB
  nome: alimento.nome,
  energia_kcal: +(parseFloat(alimento.energia_kcal) * rapporto).toFixed(1),
  proteine: +(parseFloat(alimento.proteine) * rapporto).toFixed(1),
  carboidrati: +(parseFloat(alimento.carboidrati) * rapporto).toFixed(1),
  lipidi_totali: +(parseFloat(alimento.lipidi_totali) * rapporto).toFixed(1),
  quantita: quantitaVal // qui deve essere "quantita"
};



  const nuovaDieta = [...dieta];
  nuovaDieta[giornoIndex][pastoIndex].push(alimentoModificato);
  setDieta(nuovaDieta);

setGramInput(prev => ({
  ...prev,
  [`${giornoIndex}-${pastoIndex}-${alimento.id}`]: quantitaVal
}));

};

  const handleRemoveFood = (dayIndex, mealIndex, idx) => {
    const updated = [...dieta];
    updated[dayIndex][mealIndex].splice(idx, 1);
    setDieta(updated);
  };

  const handleResetLayout = () => {
    const initial = giorniDefault.map((_, i) => ({
      i: String(i),
      x: i % 4,
      y: Math.floor(i / 4),
      w: 1,
      h: 6,
      minW: 1,
      minH: 4,
    }));
    setLayout(initial);
    localStorage.removeItem('dietaLayout');
  };

const handleSalvaDieta = async () => {
  if (!selectedPaziente?.id) {
    alert('⚠️ Seleziona prima un paziente');
    return;
  }
  const payload = {
    paziente_id: selectedPaziente.id,
    id_visita: fromVisita || null,
    nome_dieta: nomeDieta || (dietaSelezionata ? dietaSelezionata.nome_dieta : `Dieta ${new Date().toLocaleDateString()}`),
	peso: peso || null,
    fabbisogni: {
      fabbisogno_calorico: fabbisogni?.fabbisogno_calorico || 0,
      proteine: fabbisogni?.proteine || 0,
      grassi: fabbisogni?.grassi || 0,
      carboidrati: fabbisogni?.carboidrati || 0,
    },
    giorni: giorniDefault.map((_, giornoIndex) => ({
      numero_giorno: giornoIndex + 1,
      note: '',
      pasti: dieta[giornoIndex].map((pasto, pastoIndex) => ({
        nome_pasto: pasti[pastoIndex],
        orario: null,
alimenti: pasto
  .filter(al => al.id) // non serve il controllo di "grammi"
  .map(al => {
    const parsedQuantita = parseFloat(al.quantita);
    const quantita = (!parsedQuantita || isNaN(parsedQuantita) || parsedQuantita <= 0)
                      ? 100
                      : parsedQuantita; // "quantita" viene usata ora
    return {
      alimento_id: al.id,
      quantita: quantita,
      energia_kcal: parseFloat(al.energia_kcal) || 0,
      proteine: parseFloat(al.proteine) || 0,
      carboidrati: parseFloat(al.carboidrati) || 0,
      lipidi_totali: parseFloat(al.lipidi_totali) || 0,
      note: al.note || null
    };
  })
      }))
    }))
  };

  console.log("PAYLOAD da salvare:", JSON.stringify(payload, null, 2));
  if (!window.confirm('Confermi il salvataggio della dieta?')) {
    console.log('⛔️ Salvataggio annullato dall’utente.');
    return;
  }
console.log('ALIMENTI payload:', JSON.stringify(payload.giorni.flatMap(g => g.pasti.flatMap(p => p.alimenti)), null, 2));

  try {
    const method = dietaSelezionata ? 'PUT' : 'POST';
    const url = dietaSelezionata
      ? `http://localhost:5000/api/diete/${dietaSelezionata.id}`
      : 'http://localhost:5000/api/diete/salva';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Errore durante il salvataggio');

    alert(`✅ Dieta ${dietaSelezionata ? 'aggiornata' : 'salvata'} con successo!`);
    fetchDieteSalvate(selectedPaziente.id);
    setDietaSelezionata(null);
  } catch (err) {
    console.error(err);
    alert('❌ Errore nel salvataggio della dieta.');
  }
};

  const handleDuplicaDieta = async (dieta) => {
    try {
      const res = await fetch(`http://localhost:5000/api/diete/dettaglio/${dieta.id}`);
      const json = await res.json();
      if (!json.success || !json.data || !json.data.giorni) {
        alert('❌ Dati non validi per duplicare questa dieta');
        return;
      }
      const nuovoNome = prompt("Inserisci un nome per la dieta duplicata:", `Dieta ${new Date().toLocaleDateString()}`);
      if (!nuovoNome) return;
      await fetch('http://localhost:5000/api/diete/salva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paziente_id: selectedPaziente.id,
          nome_dieta: nuovoNome,
          fabbisogni: json.data.fabbisogni || null,
          giorni: json.data.giorni
        }),
      });
      await fetchDieteSalvate(selectedPaziente.id);
      alert('✅ Dieta duplicata con successo!');
    } catch (err) {
      console.error(err);
      alert('❌ Errore durante la duplicazione.');
    }
  };

  const handleEliminaDieta = async (id) => {
    if (!window.confirm('Confermi l\'eliminazione della dieta?')) return;
    try {
      await fetch(`http://localhost:5000/api/diete/${id}`, { method: 'DELETE' });
      fetchDieteSalvate(selectedPaziente.id);
      alert('✅ Dieta eliminata');
    } catch (err) {
      console.error('Errore eliminazione dieta', err);
      alert('❌ Errore durante l\'eliminazione della dieta.');
    }
  };
  
const handleSalvaFabbisogni = async () => {
  if (!fabbisogni || !dietaSelezionata?.id) {
    toast.error("⚠️ Nessuna dieta selezionata o fabbisogni mancanti.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/diete/fabbisogni/salva/${dietaSelezionata.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...fabbisogni,
        id_visita: fromVisita || null,
      }),
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Errore salvataggio");

    toast.success("✅ Fabbisogni salvati correttamente!");
  } catch (err) {
    console.error("❌ Errore salvataggio fabbisogni:", err);
    toast.error("❌ Errore durante il salvataggio dei fabbisogni.");
  }
};

const handleCaricaDieta = async (dietaSalvata) => {
  try {
    const res = await fetch(`http://localhost:5000/api/diete/dettaglio/${dietaSalvata.id}`);
    const json = await res.json();

    if (!json.success || !json.data || !json.data.giorni) {
      alert('❌ Dati non validi per questa dieta.');
      return;
    }

    const enrichedDieta = json.data.giorni.map(giorno =>
      giorno.pasti.map(pasto =>
        pasto.alimenti.map(al => {
          const food = foods.find(f => f.id === al.alimento_id);
          if (!food) return null; // fallback se alimento mancante
          const ratio = al.quantita / 100;

          return {
            id: food.id,
            nome: food.nome,
            energia_kcal: +(food.energia_kcal * ratio).toFixed(1),
            proteine: +(food.proteine * ratio).toFixed(1),
            carboidrati: +(food.carboidrati * ratio).toFixed(1),
            lipidi_totali: +(food.lipidi_totali * ratio).toFixed(1),
quantita: al.quantita,
            note: al.note || ''
          };
        }).filter(Boolean)
      )
    );

    setDieta(enrichedDieta);
    setDietaSelezionata({ id: json.data.id, nome_dieta: json.data.nome });
    if (json.data.fabbisogni) setFabbisogni(json.data.fabbisogni);
	if ('peso' in json.data) setPeso(json.data.peso);
    alert('✅ Dieta caricata correttamente!');
  } catch (err) {
    console.error(err);
    alert('❌ Errore nel caricamento della dieta.');
  }
};
const bmi = visitaCollegata?.peso && selectedPaziente?.altezza
  ? visitaCollegata.peso / Math.pow(selectedPaziente.altezza / 100, 2)
  : null;

const pesoIdeale = selectedPaziente?.altezza
  ? selectedPaziente.altezza - 100 - ((selectedPaziente.altezza - 150) / 4)
  : null;

  const totalSettimana = dieta.reduce(
    (acc, day) => {
      const dayTotal = totalPerGiorno(day);
      return {
        kcal: acc.kcal + dayTotal.kcal,
        proteine: acc.proteine + dayTotal.proteine,
        grassi: acc.grassi + dayTotal.grassi,
        carboidrati: acc.carboidrati + dayTotal.carboidrati,
      };
    },
    { kcal: 0, proteine: 0, grassi: 0, carboidrati: 0 }
  );

  const confrontoGiornaliero = (tot, fab) => {
    if (!fab) return null;
    const safePercent = (val, ref) => {
      if (!ref || ref === 0 || isNaN(ref)) return '–';
      return ((val / ref) * 100).toFixed(0) + '%';
    };
    return {
      kcal: safePercent(tot.kcal, fab.fabbisogno_calorico),
      proteine: safePercent(tot.proteine, fab.proteine),
      grassi: safePercent(tot.grassi, fab.grassi),
      carboidrati: safePercent(tot.carboidrati, fab.carboidrati),
    };
  };

  const evidenzia = (valore, fabbisognoSett) => {
    if (!fabbisognoSett) return '';
    const ratio = (valore / fabbisognoSett) * 100;
    return ratio < 90 || ratio > 110 ? 'text-red-600 font-bold' : '';
  };

  return (
    <div className="flex gap-3 p-2">
{/* Colonna sinistra: Sidebar Totali (intelligente e riducibile) */}
<div className={`${sidebarCollassata ? 'w-12' : (modalitaCompatta ? 'w-52 p-2' : 'w-64 p-3')} sticky top-4 bg-gray-100 rounded shadow text-xs max-h-[calc(100vh-2rem)] overflow-y-auto transition-all duration-300`}>
  <button
    onClick={() => setSidebarCollassata(prev => !prev)}
    className="text-xs font-semibold text-blue-700 hover:underline mb-2 w-full text-left"
    title={sidebarCollassata ? 'Mostra sidebar' : 'Nascondi sidebar'}
  >
    📊 Totali {sidebarCollassata ? '▶' : '▼'}
  </button>

  {sidebarCollassata ? (
    <div className="flex flex-col items-center text-[10px] text-gray-600">
      <div className="text-sm leading-tight">📊</div>
      <div className="font-bold text-blue-800">{totalSettimana.kcal.toFixed(0)} kcal</div>
      <div className="text-green-600 text-[9px]">{totalSettimana.proteine.toFixed(0)}g P</div>
      <div className="text-yellow-600 text-[9px]">{totalSettimana.grassi.toFixed(0)}g G</div>
      <div className="text-blue-600 text-[9px]">{totalSettimana.carboidrati.toFixed(0)}g C</div>
    </div>
  ) : (
    <>
      <h2 className="font-bold mb-2">Totali Settimanali:</h2>
      <p className={evidenzia(totalSettimana.kcal, fabbisogni?.fabbisogno_calorico * 7)}>
        Calorie: {totalSettimana.kcal.toFixed(1)} kcal
      </p>
      <p className={evidenzia(totalSettimana.proteine, fabbisogni?.proteine * 7)}>
        Proteine: {totalSettimana.proteine.toFixed(1)} g
      </p>
      <p className={evidenzia(totalSettimana.grassi, fabbisogni?.grassi * 7)}>
        Grassi: {totalSettimana.grassi.toFixed(1)} g
      </p>
      <p className={evidenzia(totalSettimana.carboidrati, fabbisogni?.carboidrati * 7)}>
        Carboidrati: {totalSettimana.carboidrati.toFixed(1)} g
      </p>

      <div className="mt-2 text-[11px] font-medium">
        <div className="text-gray-500">Copertura settimanale:</div>
        <ul className="ml-3 list-disc">
          {fabbisogni && (
            ['kcal', 'proteine', 'grassi', 'carboidrati'].map((nutriente) => {
              const tot = totalSettimana[nutriente];
              const fab = fabbisogni[
                nutriente === 'kcal' ? 'fabbisogno_calorico' : nutriente
              ] * 7;
              const perc = ((tot / fab) * 100).toFixed(0);
              const percNum = parseFloat(perc);
              let colore = 'text-green-600';
              let simbolo = '🟢';
              if (percNum < 95) {
                colore = 'text-red-600';
                simbolo = '🔴';
              } else if (percNum > 105) {
                colore = 'text-yellow-600';
                simbolo = '🟡';
              }
              const labelMap = {
                kcal: 'Calorie',
                proteine: 'Proteine',
                grassi: 'Grassi',
                carboidrati: 'Carboidrati',
              };
              return (
                <li key={nutriente} className={`${colore} font-bold`}>
                  {simbolo} {labelMap[nutriente]}: {perc}%
                </li>
              );
            })
          )}
        </ul>
      </div>

      <ResponsiveContainer width="100%" height={150} className="my-4">
        <PieChart>
          <Pie
            dataKey="value"
            data={[
              { name: 'Proteine', value: totalSettimana.proteine },
              { name: 'Grassi', value: totalSettimana.grassi },
              { name: 'Carboidrati', value: totalSettimana.carboidrati },
            ]}
            outerRadius={50}
            label
          >
            {COLORS.map((color, index) => (
              <Cell key={index} fill={color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="text-[11px] text-gray-700 space-y-2 mt-2">
        {fabbisogni && (
          <div className="mt-2 pt-2 text-[10px] border-t border-gray-300">
            <div className="font-semibold text-gray-600 mb-1 mt-2">📊 Fabbisogni settimanali</div>
            <ul className="list-disc pl-4 mt-1">
              <li>Calorie: {(fabbisogni.fabbisogno_calorico * 7).toFixed(0)} kcal</li>
              <li>Proteine: {(fabbisogni.proteine * 7).toFixed(1)} g</li>
              <li>Grassi: {(fabbisogni.grassi * 7).toFixed(1)} g</li>
              <li>Carboidrati: {(fabbisogni.carboidrati * 7).toFixed(1)} g</li>
              <li className="italic text-gray-400 mt-1">* Calcolati su base settimanale</li>
            </ul>
          </div>
        )}
        <div className="font-semibold text-gray-600 mb-1 mt-2">🧠 Suggerimenti</div>
        <ul className="list-disc pl-4">
          {fabbisogni ? (
            suggerisciAlimenti(totalSettimana, fabbisogni).map((sugg, idx) => (
              <li key={idx}>{sugg}</li>
            ))
          ) : (
            <li className="italic text-gray-400">Nessun suggerimento disponibile</li>
          )}
        </ul>
      </div>
    </>
  )}
</div>

      {/* Colonna destra: Gestione e Lista diete */}
      <div className="flex-1">
        <div className="flex justify-between mb-4 items-center">
          <div>
            {dietaSelezionata && (
              <div className="space-y-2">
                <div className="text-sm text-red-600 font-bold">
                  📝 <span className="underline">{dietaSelezionata.nome_dieta}</span>
                </div>
				{modificaAttiva && (
  <div className="text-xs font-semibold bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 inline-block rounded mt-1">
    🛠 Modalità modifica attiva
  </div>
)}

                {visitaCollegata && (
                  <div className="text-xs bg-blue-50 border border-blue-200 p-2 rounded">
                    <strong>Visita collegata:</strong><br />
                    📅 {visitaCollegata.data}<br />
                    ⚖️ Peso: {visitaCollegata.peso} kg<br />
                    🏃‍♀️ Attività: {visitaCollegata.attivita_fisica}<br />
                    🩸 Glicemia: {visitaCollegata.glicemia}
                  </div>
                )}
              </div>
            )}
            {fromVisita && (
              <div className="text-xs text-blue-600 font-medium mb-2">
                📌 Stai creando una dieta collegata alla visita ID{' '}
                <a href={`/dati-evolutivi?for=${visitaCollegata?.id_paziente || ''}`} className="underline hover:text-blue-800 font-bold">
                  {fromVisita}
                </a>
              </div>
            )}
          </div>
          <div className="text-sm">
            <button onClick={() => setShowDieteSalvate(!showDieteSalvate)} className="text-blue-600 hover:underline">
              {showDieteSalvate ? '➖ Nascondi diete salvate' : '📋 Mostra diete salvate'}
            </button>
            {showDieteSalvate && (
              <div className="mt-2 text-sm border rounded p-3 bg-white max-w-xl shadow">
                {dieteSalvate.length === 0 ? (
                  <p className="italic text-gray-500">Nessuna dieta salvata</p>
                ) : (
                  <ul className="space-y-3">
                    {dieteSalvate.map((d) => (
                      <li
                        key={d.id}
                        className={`border px-3 py-2 rounded flex justify-between items-center ${
                          dietaSelezionata?.id === d.id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                        }`}
                      >
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const nuovoNome = e.target.textContent.trim();
                            if (nuovoNome && nuovoNome !== d.nome_dieta) {
                              fetch(`http://localhost:5000/api/diete/${d.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ nome_dieta: nuovoNome }),
                              })
                                .then(() => {
                                  fetchDieteSalvate(selectedPaziente.id);
                                  alert('✅ Nome dieta aggiornato');
                                })
                                .catch(() => alert('❌ Errore aggiornamento nome'));
                            }
                          }}
                          className="font-semibold outline-none hover:bg-yellow-100 px-1 rounded"
                          title="Clicca per modificare il nome"
                        >
                          {d.nome_dieta}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleCaricaDieta(d)} className="text-blue-600 text-xs underline">
                            Seleziona
                          </button>
                          <button onClick={() => handleDuplicaDieta(d)} className="text-green-600 text-xs underline">
                            Duplica
                          </button>
                          <button onClick={() => handleEliminaDieta(d.id)} className="text-red-600 text-xs underline">
                            Elimina
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {dietaSelezionata && (
              <button
                onClick={() => handleDuplicaDieta(dietaSelezionata)}
                className="ml-2 px-3 py-1 rounded shadow text-sm bg-blue-400 hover:bg-blue-500 text-white"
              >
                💾 Salva come nuova
              </button>
            )}
          </div>
{dietaSelezionata ? (
  <>
    {!modificaAttiva ? (
      <button
        onClick={() => setModificaAttiva(true)}
        className="px-3 py-1 rounded shadow text-sm bg-yellow-400 text-black hover:bg-yellow-500 mr-2"
      >
        ✏️ Modifica
      </button>
    ) : (
      <div className="flex gap-2">
        <button
          onClick={() => setModificaAttiva(false)}
          className="px-3 py-1 rounded shadow text-sm bg-gray-300 text-black hover:bg-gray-400"
        >
          ❌ Annulla
        </button>
        <button
          onClick={handleSalvaDieta}
          className="px-3 py-1 rounded shadow text-sm text-white bg-yellow-500 hover:bg-yellow-600"
        >
          🔁 Aggiorna dieta
        </button>
      </div>
    )}
  </>
) : (
  <button
    onClick={handleSalvaDieta}
    className="px-3 py-1 rounded shadow text-sm bg-blue-600 hover:bg-blue-700 text-white"
  >
    💾 Salva dieta
  </button>
)}

        </div>
{/* Parametri paziente e fabbisogni */}
<div className={`${modalitaCompatta ? 'p-1 text-xs' : 'p-2 text-sm'} bg-blue-50 border border-blue-200 rounded mb-2 shadow-sm`}>
<div className="flex flex-wrap justify-between gap-2">
    <div>
      <strong>📏 Altezza:</strong> {selectedPaziente?.altezza || '-'} cm
    </div>
<div className="flex items-center gap-1">
  <strong>⚖️ Peso:</strong>
  {modificaPeso ? (
    <input
      type="number"
      className="border px-1 py-0.5 rounded w-20 text-sm"
      value={peso || ''}
      onChange={(e) => setPeso(parseFloat(e.target.value))}
      onBlur={() => setModificaPeso(false)}
      autoFocus
    />
  ) : (
    <span
      className="cursor-pointer underline decoration-dotted decoration-1 hover:text-blue-700"
      title="Clicca per modificare il peso"
      onClick={() => setModificaPeso(true)}
    >
      {peso || visitaCollegata?.peso || '-'} kg ✏️
    </span>
  )}
</div>

<div>
  <strong>💪 BMI:</strong>{' '}
  {selectedPaziente?.altezza && peso ? (
    (() => {
      const bmiVal = peso / Math.pow(selectedPaziente.altezza / 100, 2);
      const category =
        bmiVal < 18.5
          ? 'Sottopeso'
          : bmiVal < 25
          ? 'Normale'
          : bmiVal < 30
          ? 'Sovrappeso'
          : 'Obeso';

      const emoji =
        bmiVal < 18.5 ? '😟' : bmiVal < 25 ? '💪' : bmiVal < 30 ? '⚠️' : '❌';

      const colore =
        bmiVal < 18.5
          ? 'text-blue-600'
          : bmiVal < 25
          ? 'text-green-600'
          : bmiVal < 30
          ? 'text-yellow-600'
          : 'text-red-600';

      return (
        <span className={`${colore} font-bold`} title={`Categoria: ${category}`}>
          {bmiVal.toFixed(1)} {emoji}
        </span>
      );
    })()
  ) : (
    '-'
  )}
</div>

<div>
  <strong>🎯 Peso ideale:</strong>{' '}
  {(() => {
    if (!selectedPaziente?.altezza || !peso) return '-';
    const pesoIdeale = 22 * Math.pow(selectedPaziente.altezza / 100, 2);
    const scostamento = peso - pesoIdeale;
    const scostamentoPercent = (scostamento / pesoIdeale) * 100;
    let color = 'text-green-700 font-bold';
    if (Math.abs(scostamentoPercent) > 10) color = 'text-red-600 font-bold';
    else if (Math.abs(scostamentoPercent) > 5) color = 'text-yellow-600 font-bold';

    return (
      <span className={color} title={`Scostamento: ${scostamento >= 0 ? '+' : ''}${scostamentoPercent.toFixed(1)}%`}>
{pesoIdeale.toFixed(1)} kg
<br />
<span className="text-xs italic text-gray-600">
  ({scostamento >= 0 ? '+' : ''}{scostamentoPercent.toFixed(1)}%)
</span>
<div className="w-32 h-2 bg-gray-200 rounded mt-1 overflow-hidden">
  <div
    className={`h-full ${Math.abs(scostamentoPercent) > 10 ? 'bg-red-500' : Math.abs(scostamentoPercent) > 5 ? 'bg-yellow-400' : 'bg-green-500'}`}
    style={{
      width: `${Math.min(Math.abs(scostamentoPercent), 100)}%`,
      marginLeft: scostamentoPercent < 0 ? `${100 - Math.min(Math.abs(scostamentoPercent), 100)}%` : '0',
      transition: 'width 0.3s ease'
    }}
    title={`Scostamento visivo: ${scostamentoPercent.toFixed(1)}%`}
  ></div>
</div>
      </span>
    );
  })()}
</div>

    <div>
      <strong>🔥 Fabb. giornaliero:</strong> {fabbisogni?.fabbisogno_calorico || 0} kcal
    </div>
  </div>
</div>
{/* Grid Layout per giorni, pasti e alimenti */}
<div className="mb-2 flex justify-between items-center px-2">
  <div className="flex gap-2 overflow-x-auto">
    {giorniDefault.map((dayLabel, index) => (
      <button
        key={index}
        onClick={() => setTabAttivo(index)}
        className={`whitespace-nowrap px-${modalitaCompatta ? '2' : '3'} py-${modalitaCompatta ? '0.5' : '1.5'} rounded-full border text-sm transition-all duration-150 ${
          tabAttivo === index
            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
        }`}
      >
        {dayLabel}
      </button>
    ))}
  </div>

  <div className="text-sm flex items-center gap-2">
    <input
      type="checkbox"
      checked={modalitaCompatta}
      onChange={() => setModalitaCompatta(prev => !prev)}
    />
    <label>Modalità compatta</label>
  </div>
</div>


{/* CONTENUTO GIORNO ATTIVO */}
{tabAttivo < 7 && (
  <div className="bg-white shadow rounded p-4">
    {(() => {
      const dayIndex = tabAttivo;
      const tot = totalPerGiorno(dieta[dayIndex]);
      const perc = confrontoGiornaliero(tot, fabbisogni);

      return (
        <>
          <div className="text-sm font-bold mb-2">
            Giorno {dayIndex + 1}
          </div>
          <div className="text-xs bg-gray-100 mb-1 p-1 rounded">
            Totale: {tot.kcal.toFixed(1)} kcal – {tot.proteine.toFixed(1)}g prot. – {tot.grassi.toFixed(1)}g grassi – {tot.carboidrati.toFixed(1)}g carb.
          </div>

          {pasti.map((meal, mealIndex) => (
            <div key={mealIndex} className="mb-2">
<div className={`mt-0.5 border rounded shadow-sm overflow-hidden ${
  modificaAttiva ? 'border-red-400 ring-2 ring-red-200' : ''
}`}>

                <button
                  onClick={() => {
                    const updated = [...openMeals];
                    updated[dayIndex][mealIndex] = !updated[dayIndex][mealIndex];
                    setOpenMeals(updated);
                  }}
                  className={`w-full text-left px-3 py-2 font-medium text-sm flex justify-between items-center ${
                    openMeals[dayIndex][mealIndex] ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                >
                  {meal}
                  <span className="text-xs">{openMeals[dayIndex][mealIndex] ? '▲' : '▼'}</span>
                </button>

                <AnimatePresence initial={false}>
                  {openMeals[dayIndex][mealIndex] && (
                    <motion.div
                      key={`${dayIndex}-${mealIndex}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden p-2"
                    >
                      <input
                        type="text"
                        placeholder="🔍 Cerca alimento..."
                        className="border px-3 py-2 rounded w-full mt-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        value={searchValues[dayIndex][mealIndex]}
                        onChange={(e) => {
                          const updatedSearch = [...searchValues];
                          updatedSearch[dayIndex][mealIndex] = e.target.value;
                          setSearchValues(updatedSearch);
                        }}
                        autoComplete="off"
                      />
                      <table className="w-full text-xs my-2">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Kcal</th>
                            <th>Gr</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {foods
                            .filter(f =>
                              f.nome.toLowerCase().includes(searchValues[dayIndex][mealIndex].toLowerCase())
                            )
                            .slice(0, 3)
                            .map(food => (
                              <tr key={food.id}>
                                <td>{food.nome}</td>
                                <td>{food.energia_kcal}</td>
                                <td>
                                  <input
                                    type="number"
                                    className="border p-1 w-16 text-xs"
                                    placeholder="gr"
                                    defaultValue="100"
                                    onChange={(e) => {
                                      const quantitaVal = parseFloat(e.target.value) || 100;
                                      setGramInput(prev => ({
                                        ...prev,
                                        [`${dayIndex}-${mealIndex}-${food.id}`]: quantitaVal
                                      }));
                                    }}
                                  />
                                </td>
                                <td>
                                  <button
                                    onClick={() => handleAddFood(dayIndex, mealIndex, food)}
                                    className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                                  >
                                    +
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      <ul className="text-xs list-disc pl-4">
                        {dieta[dayIndex][mealIndex].map((food, idx) => (
                          <li key={idx}>
                            {food.nome} – {food.quantita || 100} g
                            <button
                              onClick={() => handleRemoveFood(dayIndex, mealIndex, idx)}
                              className="ml-2 text-red-500"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </>
      );
    })()}
  </div>
)}

{tabAttivo === 7 && (
  <div className="bg-white shadow rounded p-6 text-sm">
    <h2 className="text-lg font-bold mb-4">📈 Calcolo Fabbisogni Giornalieri</h2>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 font-medium">⚖️ Peso (kg)</label>
        <input
          type="number"
          className="border rounded w-full px-3 py-1"
          value={peso || ''}
          onChange={(e) => setPeso(parseFloat(e.target.value))}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">📏 Altezza (cm)</label>
        <input
          type="number"
          className="border rounded w-full px-3 py-1"
          value={selectedPaziente?.altezza || ''}
          readOnly
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">🚻 Sesso</label>
        <input
          type="text"
          readOnly
          value={(() => {
            const cf = selectedPaziente?.codice_fiscale || '';
            const giorno = parseInt(cf.slice(9, 11));
            return giorno > 31 ? 'F' : 'M';
          })()}
          className="border rounded w-full px-3 py-1 bg-gray-100"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">🎂 Età</label>
        <input
          type="text"
          readOnly
          value={(() => {
            const cf = selectedPaziente?.codice_fiscale || '';
            const anno = parseInt(cf.slice(6, 8));
            const secolo = anno < 25 ? 2000 : 1900;
            const annoCompleto = secolo + anno;
            const oggi = new Date();
            return oggi.getFullYear() - annoCompleto;
          })()}
          className="border rounded w-full px-3 py-1 bg-gray-100"
        />
      </div>

      <div className="col-span-2">
        <label className="block mb-1 font-medium">🏃 Attività fisica</label>
        <select
          className="border rounded w-full px-3 py-1"
          value={visitaCollegata?.attivita_fisica || 'sedentario'}
          onChange={(e) =>
            setVisitaCollegata((prev) => ({
              ...prev,
              attivita_fisica: e.target.value,
            }))
          }
        >
          <option value="sedentario">Sedentario</option>
          <option value="leggero">Leggero</option>
          <option value="moderato">Moderato</option>
          <option value="intenso">Intenso</option>
        </select>
      </div>
    </div>

    <div className="mt-6">
<button
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  onClick={() => {
    const altezza = selectedPaziente?.altezza;
    const pesoCorrente = peso || visitaCollegata?.peso;
    const cf = selectedPaziente?.codice_fiscale || '';
    const giorno = parseInt(cf.slice(9, 11));
    const sesso = giorno > 31 ? 'F' : 'M';
    const anno = parseInt(cf.slice(6, 8));
    const secolo = anno < 25 ? 2000 : 1900;
    const annoCompleto = secolo + anno;
    const oggi = new Date();
    const eta = oggi.getFullYear() - annoCompleto;
    const attivita = visitaCollegata?.attivita_fisica || 'sedentario';

    if (!altezza || !pesoCorrente || !eta) {
      alert('⚠️ Inserisci altezza, peso e data di nascita.');
      return;
    }

    // Calcolo BMR con Mifflin-St Jeor
    const bmr =
      sesso === 'M'
        ? 10 * pesoCorrente + 6.25 * altezza - 5 * eta + 5
        : 10 * pesoCorrente + 6.25 * altezza - 5 * eta - 161;

    const fattori = {
      sedentario: 1.2,
      leggero: 1.375,
      moderato: 1.55,
      intenso: 1.725,
    };

    const fabbisogno_calorico = Math.round(bmr * (fattori[attivita] || 1.2));

    // Macronutrienti: 15% prot, 25% grassi, 60% carb
    const proteine = Math.round((0.15 * fabbisogno_calorico) / 4);
    const grassi = Math.round((0.25 * fabbisogno_calorico) / 9);
    const carboidrati = Math.round((0.60 * fabbisogno_calorico) / 4);

    setFabbisogni({
      fabbisogno_calorico,
      proteine,
      grassi,
      carboidrati,
    });

    toast.success('✅ Fabbisogni calcolati correttamente!');
  }}
>
  ⚙️ Calcola fabbisogno
</button>
<div className="mt-2">
  <button
    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    onClick={handleSalvaFabbisogni}
  >
    💾 Salva fabbisogni
  </button>
</div>

    </div>
  </div>
)}


      </div>
    </div>
  );
}

// Helper functions per il calcolo nutrizionale
function totalPerPasto(items) {
  return items.reduce(
    (acc, food) => ({
      kcal: acc.kcal + (parseFloat(food.energia_kcal) || 0),
      proteine: acc.proteine + (parseFloat(food.proteine) || 0),
      grassi: acc.grassi + (parseFloat(food.lipidi_totali) || 0),
      carboidrati: acc.carboidrati + (parseFloat(food.carboidrati) || 0),
    }),
    { kcal: 0, proteine: 0, grassi: 0, carboidrati: 0 }
  );
}

function totalPerGiorno(day) {
  return day.reduce(
    (acc, meal) => {
      const mealTotal = totalPerPasto(meal);
      return {
        kcal: acc.kcal + mealTotal.kcal,
        proteine: acc.proteine + mealTotal.proteine,
        grassi: acc.grassi + mealTotal.grassi,
        carboidrati: acc.carboidrati + mealTotal.carboidrati,
      };
    },
    { kcal: 0, proteine: 0, grassi: 0, carboidrati: 0 }
  );
}

function totalSettimanaCalc(dieta) {
  return dieta.reduce(
    (acc, day) => {
      const dayTotal = totalPerGiorno(day);
      return {
        kcal: acc.kcal + dayTotal.kcal,
        proteine: acc.proteine + dayTotal.proteine,
        grassi: acc.grassi + dayTotal.grassi,
        carboidrati: acc.carboidrati + dayTotal.carboidrati,
      };
    },
    { kcal: 0, proteine: 0, grassi: 0, carboidrati: 0 }
  );
}

function confrontoGiornaliero(tot, fab) {
  if (!fab) return null;
  const safePercent = (val, ref) => {
    if (!ref || ref === 0 || isNaN(ref)) return '–';
    return ((val / ref) * 100).toFixed(0) + '%';
  };
  return {
    kcal: safePercent(tot.kcal, fab.fabbisogno_calorico),
    proteine: safePercent(tot.proteine, fab.proteine),
    grassi: safePercent(tot.grassi, fab.grassi),
    carboidrati: safePercent(tot.carboidrati, fab.carboidrati),
  };
}

function evidenzia(valore, fabbisognoSett) {
  if (!fabbisognoSett) return '';
  const ratio = (valore / fabbisognoSett) * 100;
  return ratio < 90 || ratio > 110 ? 'text-red-600 font-bold' : '';
}

function suggerisciAlimenti(totali, fabbisogni) {
  const suggerimenti = [];

  if (!fabbisogni) {
    suggerimenti.push("⚠️ Nessun fabbisogno paziente trovato. Impossibile suggerire.");
    return suggerimenti;
  }

  const sogliaMin = 0.9;
  const sogliaMax = 1.1;

  const check = (nutriente, label, suggerimento) => {
    const fabSett = (fabbisogni[nutriente] || 0) * 7;
    const val = totali[nutriente] || 0;
    const ratio = val / fabSett;
    if (ratio < sogliaMin) suggerimenti.push(`Aggiungi ${label.toLowerCase()}: ${suggerimento}`);
    else if (ratio > sogliaMax) suggerimenti.push(`Riduci ${label.toLowerCase()}: dieta eccessiva.`);
  };

  check("proteine", "Proteine", "carne magra, legumi, pesce");
  check("grassi", "Grassi", "olio EVO, frutta secca");
  check("carboidrati", "Carboidrati", "pane, pasta, cereali integrali");
  check("fabbisogno_calorico", "Calorie", "aggiungi pasti o aumentane le porzioni");

  if (suggerimenti.length === 0) {
    suggerimenti.push("Ottimo bilanciamento! Nessun aggiustamento consigliato.");
  }

  return suggerimenti;
}

function categoriaBMI(bmi) {
  if (!bmi) return '-';
  if (bmi < 18.5) return 'Sottopeso';
  if (bmi < 25) return 'Normale';
  if (bmi < 30) return 'Sovrappeso';
  return 'Obeso';
}

function coloreBMI(bmi) {
  if (!bmi) return '';
  if (bmi < 18.5) return 'text-blue-600';
  if (bmi < 25) return 'text-green-600';
  if (bmi < 30) return 'text-yellow-500';
  return 'text-red-600';
}


function calcolaFabbisogniGiornalieri(fabbisogni) {
  if (!fabbisogni) return null;
  return {
    kcal: parseFloat(fabbisogni.fabbisogno_calorico || 0),
    proteine: parseFloat(fabbisogni.proteine || 0),
    grassi: parseFloat(fabbisogni.grassi || 0),
    carboidrati: parseFloat(fabbisogni.carboidrati || 0),
  };
}

function calcolaTotaliSettimanali(dieta) {
  return dieta.reduce(
    (acc, day) => {
      day.forEach(meal => {
        meal.forEach(food => {
          acc.kcal += parseFloat(food.energia_kcal);
          acc.proteine += parseFloat(food.proteine);
          acc.grassi += parseFloat(food.lipidi_totali);
          acc.carboidrati += parseFloat(food.carboidrati);
        });
      });
      return acc;
    },
    { kcal: 0, proteine: 0, grassi: 0, carboidrati: 0 }
  );
}