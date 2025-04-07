import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import GridLayout from 'react-grid-layout';
import { suggerisciAlimenti } from '../../utils/dietaUtils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const pasti = ['Colazione', 'Spuntino Mattutino', 'Pranzo', 'Spuntino Pomeridiano', 'Cena'];
const giorni = ['Giorno 1', 'Giorno 2', 'Giorno 3', 'Giorno 4', 'Giorno 5', 'Giorno 6', 'Giorno 7'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function Index() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromVisita = new URLSearchParams(location.search).get('fromVisita');
  const edit = new URLSearchParams(location.search).get('edit');

  const [foods, setFoods] = useState([]);
  const [visitaCollegata, setVisitaCollegata] = useState(null);
  const [dieta, setDieta] = useState(giorni.map(() => pasti.map(() => [])));
  const [searchValues, setSearchValues] = useState(giorni.map(() => pasti.map(() => '')));
  const [gramInput, setGramInput] = useState({});
  const [openMeals, setOpenMeals] = useState(giorni.map(() => pasti.map(() => false)));
  const [dietaSelezionata, setDietaSelezionata] = useState(null);
  const [fabbisogni, setFabbisogni] = useState(null);
  const [selectedPaziente, setSelectedPaziente] = useState(null);
  const [layout, setLayout] = useState(
    JSON.parse(localStorage.getItem('dietaLayout')) ||
    giorni.map((_, i) => ({ i: String(i), x: i % 4, y: Math.floor(i / 4), w: 1, h: 6, minW: 1, minH: 4 }))
  );
  const [dieteSalvate, setDieteSalvate] = useState([]);
  const [showDieteSalvate, setShowDieteSalvate] = useState(false);

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

    fetch('http://localhost:5000/api/database-alimenti')
      .then(res => res.json())
      .then(data => setFoods(data));

    fetchDieteSalvate(paziente.id);

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

      // Carica fabbisogni da fabbisogni_dieta
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
          console.error('❌ Errore fetch fabbisogni:', err);
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
        if (Array.isArray(data)) {
          setDieteSalvate(data);
        } else if (data && data.diete && Array.isArray(data.diete)) {
          setDieteSalvate(data.diete);
        } else {
          console.error('⚠️ Risposta API non valida:', data);
          setDieteSalvate([]);
          alert('⚠️ Errore caricamento diete salvate.');
        }
      })
      .catch(err => {
        console.error('❌ Errore fetch:', err);
        setDieteSalvate([]);
        alert('❌ Errore rete nel caricamento delle diete.');
      });
  };

  const handleAddFood = (dayIndex, mealIndex, food) => {
    const grams = parseFloat(gramInput[`${dayIndex}-${mealIndex}-${food.id}`]) || 100;
    const ratio = grams / 100;
    const adjustedFood = {
      ...food,
      energia_kcal: (food.energia_kcal * ratio).toFixed(1),
      proteine: (food.proteine * ratio).toFixed(1),
      carboidrati: (food.carboidrati * ratio).toFixed(1),
      lipidi_totali: (food.lipidi_totali * ratio).toFixed(1),
      grams,
    };
    const updatedDieta = [...dieta];
    updatedDieta[dayIndex][mealIndex].push(adjustedFood);
    setDieta(updatedDieta);
  };

  const handleRemoveFood = (dayIndex, mealIndex, idx) => {
    const updated = [...dieta];
    updated[dayIndex][mealIndex].splice(idx, 1);
    setDieta(updated);
  };

  const handleResetLayout = () => {
    const initial = giorni.map((_, i) => ({
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
  nome_dieta: dietaSelezionata?.nome_dieta || `Dieta ${new Date().toLocaleDateString()}`,
  fabbisogni: {
    fabbisogno_calorico: fabbisogni?.fabbisogno_calorico || 0,
    proteine: fabbisogni?.proteine || 0,
    grassi: fabbisogni?.grassi || 0,
    carboidrati: fabbisogni?.carboidrati || 0,
  },
  giorni: dieta.map((giorno, giornoIndex) => ({
    numero_giorno: giornoIndex + 1,
    pasti: giorno.map((pasto, pastoIndex) => ({
      nome_pasto: pasti[pastoIndex],
      alimenti: pasto.map(al => ({
        alimento_id: al.id,
        grammi: al.grams,
        energia_kcal: parseFloat(al.energia_kcal),
        proteine: parseFloat(al.proteine),
        carboidrati: parseFloat(al.carboidrati),
        lipidi_totali: parseFloat(al.lipidi_totali)
      }))
    }))
  }))
};


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
      if (!dieta.dati) {
        alert('❌ Questa dieta non può essere duplicata (dati mancanti)');
        return;
      }

      const parsed = JSON.parse(dieta.dati);
      if (!parsed.giorni || !Array.isArray(parsed.giorni)) {
        alert('❌ Dati non validi per la duplicazione');
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
          fabbisogni: parsed.fabbisogni || null,
          giorni: parsed.giorni
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
    } catch (err) {
      console.error('Errore eliminazione dieta', err);
      alert('❌ Errore durante l\'eliminazione della dieta.');
    }
  };

  const handleCaricaDieta = (dietaSalvata) => {
    try {
      if (!dietaSalvata.dati) {
        alert('❌ Questa dieta non contiene dati caricabili.');
        return;
      }

      const parsed = JSON.parse(dietaSalvata.dati);
      if (!parsed.giorni || !Array.isArray(parsed.giorni)) {
        alert('❌ Formato dati non valido.');
        return;
      }

      const nuovaDieta = parsed.giorni.map(g => g.pasti.map(p => p.alimenti));
      setDieta(nuovaDieta);
      setDietaSelezionata(dietaSalvata);
      if (parsed.fabbisogni) setFabbisogni(parsed.fabbisogni);
      alert('✅ Dieta caricata correttamente');
    } catch (err) {
      console.error(err);
      alert('❌ Errore nel caricamento della dieta');
    }
  };

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
<div className="w-64 sticky top-4 bg-gray-100 p-4 rounded shadow text-xs">
  <h2 className="font-bold mb-2">Totali Settimanali:</h2>
  <p className={evidenzia(totalSettimana.kcal, fabbisogni?.fabbisogno_calorico * 7)}>Calorie: {totalSettimana.kcal.toFixed(1)} kcal</p>
  <p className={evidenzia(totalSettimana.proteine, fabbisogni?.proteine * 7)}>Proteine: {totalSettimana.proteine.toFixed(1)} g</p>
  <p className={evidenzia(totalSettimana.grassi, fabbisogni?.grassi * 7)}>Grassi: {totalSettimana.grassi.toFixed(1)} g</p>
  <p className={evidenzia(totalSettimana.carboidrati, fabbisogni?.carboidrati * 7)}>Carboidrati: {totalSettimana.carboidrati.toFixed(1)} g</p>

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
<a
  href={`/dati-evolutivi?for=${visitaCollegata?.id_paziente || ''}`}
  className="underline hover:text-blue-800 font-bold"
>
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
              <button onClick={() => handleCaricaDieta(d)} className="text-blue-600 text-xs underline">Seleziona</button>
              <button onClick={() => handleDuplicaDieta(d)} className="text-green-600 text-xs underline">Duplica</button>
              <button onClick={() => handleEliminaDieta(d.id)} className="text-red-600 text-xs underline">Elimina</button>
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
          {giorni.map((day, dayIndex) => {
            const tot = totalPerGiorno(dieta[dayIndex]);
            const perc = confrontoGiornaliero(tot, fabbisogni);

            return (
              <div key={dayIndex} className="bg-white shadow rounded p-2 overflow-auto">
                <div className="text-sm font-bold dragHandle cursor-move">{day}

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
        const perc = n.ref && n.ref > 0 ? ((n.val / n.ref) * 100).toFixed(0) : '–';
        const percNum = parseFloat(perc);
        const colore = badgeClass(percNum);
        const icona = emoji(percNum);
        return (
          <div key={i} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colore}`}>
            {icona} {n.nome}: {perc}%
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

                {fabbisogni && (
                  <div className="text-[11px] mt-1 text-gray-700">
                    <strong>Copertura:</strong>
                    <ul className="pl-4 list-disc">
                      <li className={evidenzia(tot.kcal, fabbisogni.fabbisogno_calorico)}>Calorie: {perc.kcal}%</li>
                      <li className={evidenzia(tot.proteine, fabbisogni.proteine)}>Proteine: {perc.proteine}%</li>
                      <li className={evidenzia(tot.grassi, fabbisogni.grassi)}>Grassi: {perc.grassi}%</li>
                      <li className={evidenzia(tot.carboidrati, fabbisogni.carboidrati)}>Carboidrati: {perc.carboidrati}%</li>
                    </ul>
                  </div>
                )}

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
                          <thead><tr><th>Nome</th><th>Kcal</th><th>Gr</th><th></th></tr></thead>
                          <tbody>
                            {foods
                              .filter(f => f.nome.toLowerCase().includes(searchValues[dayIndex][mealIndex].toLowerCase()))
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
