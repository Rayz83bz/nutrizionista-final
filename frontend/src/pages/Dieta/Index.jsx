// src/pages/Dieta/Index.jsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import GridLayout from 'react-grid-layout';
//import { suggerisciAlimenti } from '../../utils/dietaUtils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const pasti = ['Colazione', 'Spuntino Mattutino', 'Pranzo', 'Spuntino Pomeridiano', 'Cena'];
const giorniDefault = ['Giorno 1', 'Giorno 2', 'Giorno 3', 'Giorno 4', 'Giorno 5', 'Giorno 6', 'Giorno 7'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function Index() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromVisita = new URLSearchParams(location.search).get('fromVisita');
  const edit = new URLSearchParams(location.search).get('edit');

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

  useEffect(() => {
    if (!fromVisita && !edit) {
      navigate('/diete/form');
    }
  }, [fromVisita, edit, navigate]);

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
  const grammi = parseFloat(gramInput[`${giornoIndex}-${pastoIndex}-${alimento.id}`]) || 100;
  const rapporto = grammi / 100;

  const alimentoModificato = {
    id: alimento.id, // ✅ ID originale dal DB
    nome: alimento.nome,
    energia_kcal: +(parseFloat(alimento.energia_kcal) * rapporto).toFixed(1),
    proteine: +(parseFloat(alimento.proteine) * rapporto).toFixed(1),
    carboidrati: +(parseFloat(alimento.carboidrati) * rapporto).toFixed(1),
    lipidi_totali: +(parseFloat(alimento.lipidi_totali) * rapporto).toFixed(1),
    grammi
  };

  const nuovaDieta = [...dieta];
  nuovaDieta[giornoIndex][pastoIndex].push(alimentoModificato);
  setDieta(nuovaDieta);

  setGramInput(prev => ({
    ...prev,
    [`${giornoIndex}-${pastoIndex}-${alimento.id}`]: grammi
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
      pazienteId: selectedPaziente.id,
      id_visita: fromVisita || null,
nome_dieta: nomeDieta || dietaSelezionata?.nome_dieta || `Dieta ${new Date().toLocaleDateString()}`,
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
    alimenti: pasto.map(a => ({
      alimento_id: a.id,
      grammi: a.grammi,
      energia_kcal: a.energia_kcal,
      proteine: a.proteine,
      carboidrati: a.carboidrati,
      lipidi_totali: a.lipidi_totali,
      note: a.note || null
    }))
  }))
}))

    };
console.log('📦 Payload da salvare:', JSON.stringify(payload, null, 2));
if (!window.confirm('Confermi il salvataggio della dieta?')) {
  console.log('⛔️ Salvataggio annullato dall’utente.');
  return;
}

    try {
      const method = dietaSelezionata ? 'PUT' : 'POST';
      const url = dietaSelezionata
        ? `http://localhost:5000/api/diete/${dietaSelezionata.id}`
        : 'http://localhost:5000/api/diete/salva';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          pazienteId: selectedPaziente.id,
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
            grams: al.quantita,
            note: al.note || ''
          };
        }).filter(Boolean)
      )
    );

    setDieta(enrichedDieta);
    setDietaSelezionata({ id: json.data.id, nome_dieta: json.data.nome });
    if (json.data.fabbisogni) setFabbisogni(json.data.fabbisogni);
    alert('✅ Dieta caricata correttamente!');
  } catch (err) {
    console.error(err);
    alert('❌ Errore nel caricamento della dieta.');
  }
};

  // Helper per i totali nutrizionali
  const totalPerPasto = (items) =>
    items.reduce(
      (acc, food) => ({
        kcal: acc.kcal + parseFloat(food.energia_kcal),
        proteine: acc.proteine + parseFloat(food.proteine),
        grassi: acc.grassi + parseFloat(food.lipidi_totali),
        carboidrati: acc.carboidrati + parseFloat(food.carboidrati),
      }),
      { kcal: 0, proteine: 0, grassi: 0, carboidrati: 0 }
    );

  const totalPerGiorno = (day) =>
    day.reduce(
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
    <div className="flex gap-6 p-4">
      {/* Colonna sinistra: Riepilogo e Totali */}
      <div className="w-64 sticky top-4 bg-gray-100 p-4 rounded shadow text-xs">
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
              <>
                {['kcal', 'proteine', 'grassi', 'carboidrati'].map((nutriente) => {
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
                })}
              </>
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
        <div className="text-[10px] text-gray-500">
          <strong>Suggerimenti:</strong>
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
        <div className="mt-4 border-t pt-2">
          <button onClick={handleResetLayout} className="bg-red-500 text-white px-2 py-1 rounded text-xs w-full">
            🔄 Reset Layout
          </button>
        </div>
        {fabbisogni && (
          <div className="mt-4 border-t pt-2 text-[10px]">
            <strong>Fabbisogni settimanali (riferimento):</strong>
            <ul className="list-disc pl-4 mt-1">
              <li>Calorie: {(fabbisogni.fabbisogno_calorico * 7).toFixed(0)} kcal</li>
              <li>Proteine: {(fabbisogni.proteine * 7).toFixed(1)} g</li>
              <li>Grassi: {(fabbisogni.grassi * 7).toFixed(1)} g</li>
              <li>Carboidrati: {(fabbisogni.carboidrati * 7).toFixed(1)} g</li>
              <li className="italic text-gray-400 mt-1">* Percentuali forzate su 7 giorni</li>
            </ul>
          </div>
        )}
      </div>

      {/* Colonna destra: Gestione e Lista diete */}
      <div className="flex-1">
        <div className="flex justify-between mb-4 items-center">
          <div>
            {dietaSelezionata && (
              <div className="space-y-2">
                <div className="text-sm text-red-600 font-bold">
                  📝 Modifica attiva: <span className="underline">{dietaSelezionata.nome_dieta}</span>
                </div>
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
          <button
            onClick={handleSalvaDieta}
            className={`px-3 py-1 rounded shadow text-sm text-white ${dietaSelezionata ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {dietaSelezionata ? '🔁 Aggiorna dieta' : '💾 Salva dieta'}
          </button>
        </div>

        {/* Grid Layout per giorni, pasti e alimenti */}
        <GridLayout
          className="layout"
          cols={4}
          rowHeight={50}
          width={1000}
          isResizable
          layout={layout}
          onLayoutChange={(newLayout) => {
            setLayout(newLayout);
            localStorage.setItem('dietaLayout', JSON.stringify(newLayout));
          }}
          draggableHandle=".dragHandle"
        >
          {giorniDefault.map((dayLabel, dayIndex) => {
            const tot = totalPerGiorno(dieta[dayIndex]);
            const perc = confrontoGiornaliero(tot, fabbisogni);
            return (
              <div key={dayIndex} className="bg-white shadow rounded p-2 overflow-auto">
                <div className="text-sm font-bold dragHandle cursor-move">
                  {`Giorno ${dayIndex + 1}`}
                  {fabbisogni && (() => {
                    const nutrienti = [
                      { nome: 'Calorie', val: tot.kcal, ref: fabbisogni.fabbisogno_calorico },
                      { nome: 'Proteine', val: tot.proteine, ref: fabbisogni.proteine },
                      { nome: 'Grassi', val: tot.grassi, ref: fabbisogni.grassi },
                      { nome: 'Carboidrati', val: tot.carboidrati, ref: fabbisogni.carboidrati },
                    ];
                    const badgeClass = (perc) => {
                      if (perc < 95) return 'bg-red-100 text-red-800 border border-red-300';
                      if (perc > 105) return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
                      return 'bg-green-100 text-green-800 border border-green-300';
                    };
                    const emoji = (perc) => {
                      if (perc < 95) return '🔴';
                      if (perc > 105) return '🟡';
                      return '🟢';
                    };
                    return (
                      <div className="text-xs mt-1 flex flex-wrap gap-1">
                        <div className="text-[10px] text-gray-500 mt-1">
                          <span className="font-semibold">Legenda:</span>{' '}
                          <span className="inline-block mr-2">🟢 = OK (95–105%)</span>
                          <span className="inline-block mr-2">🟡 = Eccesso (&gt;105%)</span>
                          <span className="inline-block mr-2">🔴 = Carenza (&lt;95%)</span>
                        </div>
                        {nutrienti.map((n, i) => {
                          const percValue = n.ref && n.ref > 0 ? ((n.val / n.ref) * 100).toFixed(0) : '–';
                          const percNum = parseFloat(percValue);
                          const colore = badgeClass(percNum);
                          const icona = emoji(percNum);
                          return (
                            <div key={i} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colore}`}>
                              {icona} {n.nome}: {percValue}%
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                <div className="text-xs bg-gray-100 mt-1 p-1 rounded">
                  Totale: {tot.kcal.toFixed(1)} kcal – {tot.proteine.toFixed(1)}g prot. – {tot.grassi.toFixed(1)}g grassi – {tot.carboidrati.toFixed(1)}g carb.
                </div>
                {pasti.map((meal, mealIndex) => (
                  <div key={mealIndex} className="mt-2">
                    <button
                      onClick={() => {
                        const updated = [...openMeals];
                        updated[dayIndex][mealIndex] = !updated[dayIndex][mealIndex];
                        setOpenMeals(updated);
                      }}
                      className="bg-gray-200 text-left px-2 py-1 rounded w-full"
                    >
                      {meal}
                    </button>
                    {openMeals[dayIndex][mealIndex] && (
                      <>
                        <input
                          type="text"
                          placeholder="Cerca alimento..."
                          className="border p-1 rounded w-full mt-1"
                          value={searchValues[dayIndex][mealIndex]}
                          onChange={(e) => {
                            const updatedSearch = [...searchValues];
                            updatedSearch[dayIndex][mealIndex] = e.target.value;
                            setSearchValues(updatedSearch);
                          }}
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
                                      onChange={(e) =>
                                        setGramInput({
                                          ...gramInput,
                                          [`${dayIndex}-${mealIndex}-${food.id}`]: e.target.value,
                                        })
                                      }
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
                              {food.nome} – {food.grams} g
                              <button
                                onClick={() => handleRemoveFood(dayIndex, mealIndex, idx)}
                                className="ml-2 text-red-500"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </GridLayout>
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
