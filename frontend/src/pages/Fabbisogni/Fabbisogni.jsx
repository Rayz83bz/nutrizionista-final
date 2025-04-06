import React, { useEffect, useState } from 'react';
import { usePaziente } from '../../App';
import toast from 'react-hot-toast';

export default function Fabbisogni() {
  const { pazienteAttivo } = usePaziente();
  const [fabbisogni, setFabbisogni] = useState(null);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    if (pazienteAttivo?.id) {
      fetch(`http://localhost:5000/api/fabbisogni/${pazienteAttivo.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setFabbisogni(data[data.length - 1]);
          }
        })
        .catch(() => toast.error("Errore caricamento fabbisogni"));
    }
  }, [pazienteAttivo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFabbisogni(prev => ({ ...prev, [name]: value }));
  };

  const calcolaAutomatico = async () => {
    if (!pazienteAttivo?.id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/fabbisogni/calcola/${pazienteAttivo.id}`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore calcolo");
      toast.success("✅ Calcolo automatico eseguito");
      setFabbisogni(json.fabbisogni || {});
    } catch (err) {
      toast.error("Errore calcolo fabbisogni: " + err.message);
    }
  };

  const salva = async () => {
    if (!fabbisogni) return;
    const method = fabbisogni.id ? 'PUT' : 'POST';
    const url = fabbisogni.id
      ? `http://localhost:5000/api/fabbisogni/${fabbisogni.id}`
      : 'http://localhost:5000/api/fabbisogni';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fabbisogni, id_paziente: pazienteAttivo.id })
      });
      if (!res.ok) throw new Error("Errore salvataggio");
      toast.success("✅ Fabbisogni salvati");
      setEdit(false);
    } catch (err) {
      toast.error("Errore salvataggio: " + err.message);
    }
  };

  const Sezione = ({ titolo, campi }) => (
    <div className="bg-white p-4 rounded shadow space-y-2">
      <h2 className="text-lg font-semibold text-blue-700 mb-2">{titolo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {campi.map(({ key, label, unit }) => (
          <div key={key}>
            <label className="block text-gray-700">{label}</label>
            <div className="flex items-center gap-2">
              <input
                name={key}
                value={fabbisogni[key] || ''}
                onChange={handleChange}
                className="border p-1 rounded w-full"
                placeholder={unit}
                disabled={!edit}
              />
              <span className="text-gray-500">{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const macronutrienti = [
    { key: 'energia_kcal', label: 'Calorie', unit: 'kcal' },
    { key: 'proteine_g', label: 'Proteine', unit: 'g' },
    { key: 'carboidrati_g', label: 'Carboidrati', unit: 'g' },
    { key: 'lipidi_g', label: 'Grassi totali', unit: 'g' },
    { key: 'fibra_alimentare_g', label: 'Fibra alimentare', unit: 'g' },
    { key: 'alcool_g', label: 'Alcool', unit: 'g' },
  ];

  const vitamine = [
    { key: 'vitamina_c_mg', label: 'Vitamina C', unit: 'mg' },
    { key: 'vitamina_d_ug', label: 'Vitamina D', unit: 'µg' },
    { key: 'vitamina_b1_mg', label: 'Vitamina B1', unit: 'mg' },
    { key: 'vitamina_b2_mg', label: 'Vitamina B2', unit: 'mg' },
    { key: 'vitamina_b6_mg', label: 'Vitamina B6', unit: 'mg' },
    { key: 'vitamina_b12_ug', label: 'Vitamina B12', unit: 'µg' },
    { key: 'niacina_mg', label: 'Niacina', unit: 'mg' },
    { key: 'folati_ug', label: 'Folati', unit: 'µg' },
    { key: 'acido_pantotenico_mg', label: 'Acido pantotenico', unit: 'mg' },
    { key: 'retinolo_ug', label: 'Retinolo', unit: 'µg' },
    { key: 'beta_carotene_ug', label: 'Beta-carotene', unit: 'µg' },
  ];

  const minerali = [
    { key: 'ferro_mg', label: 'Ferro', unit: 'mg' },
    { key: 'calcio_mg', label: 'Calcio', unit: 'mg' },
    { key: 'fosforo_mg', label: 'Fosforo', unit: 'mg' },
    { key: 'magnesio_mg', label: 'Magnesio', unit: 'mg' },
    { key: 'potassio_mg', label: 'Potassio', unit: 'mg' },
    { key: 'sodio_mg', label: 'Sodio', unit: 'mg' },
    { key: 'iodio_ug', label: 'Iodio', unit: 'µg' },
    { key: 'zinco_mg', label: 'Zinco', unit: 'mg' },
    { key: 'selenio_ug', label: 'Selenio', unit: 'µg' },
  ];

  const grassi = [
    { key: 'grassi_saturi_g', label: 'Grassi saturi', unit: 'g' },
    { key: 'grassi_monoinsaturi_g', label: 'Grassi monoinsaturi', unit: 'g' },
    { key: 'grassi_polinsaturi_g', label: 'Grassi polinsaturi', unit: 'g' },
    { key: 'colesterolo_mg', label: 'Colesterolo', unit: 'mg' },
  ];

  const altri = [
    { key: 'acqua_g', label: 'Acqua', unit: 'g' },
    { key: 'zuccheri_g', label: 'Zuccheri', unit: 'g' },
    { key: 'amido_g', label: 'Amido', unit: 'g' },
  ];

  if (!pazienteAttivo) {
    return <div className="p-6 text-gray-500">⏳ Nessun paziente selezionato</div>;
  }

  if (!fabbisogni) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Fabbisogni – {pazienteAttivo.nome} {pazienteAttivo.cognome}</h1>
        <button onClick={calcolaAutomatico} className="bg-green-600 text-white px-4 py-2 rounded">
          ⚙️ Calcola automaticamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Fabbisogni – {pazienteAttivo.nome} {pazienteAttivo.cognome}
      </h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setEdit(!edit)}
          className={`px-4 py-2 rounded ${edit ? 'bg-gray-500' : 'bg-yellow-500'} text-white font-semibold`}
        >
          {edit ? '🔒 Chiudi modifica' : '✏️ Modifica manuale'}
        </button>
        <button onClick={calcolaAutomatico} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold">
          ⚙️ Calcola automaticamente
        </button>
        {edit && (
          <button onClick={salva} className="bg-green-600 text-white px-4 py-2 rounded font-semibold">
            💾 Salva
          </button>
        )}
      </div>

      <Sezione titolo="Macronutrienti" campi={macronutrienti} />
      <Sezione titolo="Vitamine" campi={vitamine} />
      <Sezione titolo="Minerali" campi={minerali} />
      <Sezione titolo="Grassi" campi={grassi} />
      <Sezione titolo="Altri nutrienti" campi={altri} />
    </div>
  );
}
