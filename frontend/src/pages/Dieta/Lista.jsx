import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaziente } from '../../App';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ListaDietePaziente() {
  const { pazienteAttivo } = usePaziente();
  const [diete, setDiete] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (pazienteAttivo?.id) {
      fetch(`http://localhost:5000/api/diete/${pazienteAttivo.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.diete)) {
            setDiete(data.diete);
          } else {
            toast.error('Errore nel caricamento delle diete');
          }
        })
        .catch(() => toast.error('Errore di rete nel caricamento delle diete'));
    }
  }, [pazienteAttivo]);

  const handleCreaDieta = () => {
    if (!pazienteAttivo?.id) return;
    navigate(`/dieta?nuova=1`);
  };

const stampaDietaPDF = async (dieta, pazienteAttivo) => {
  try {
    const res = await fetch(`http://localhost:5000/api/diete/dettaglio/${dieta.id}`);
    const json = await res.json();

    if (!json.success || !json.data?.giorni) {
      toast.error("❌ Dieta non valida per la stampa");
      return;
    }

    const alimentiDB = await fetch('http://localhost:5000/api/database-alimenti').then(r => r.json());
    const doc = new jsPDF();
    const marginLeft = 15;
    let currentY = 15;

    // Intestazione generale
    doc.setFontSize(14);
    doc.text(`Dieta: ${dieta.nome_dieta || dieta.nome || 'Senza Nome'}`, marginLeft, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.text(`Paziente: ${pazienteAttivo?.nome || ''} ${pazienteAttivo?.cognome || ''}`, marginLeft, currentY);
    currentY += 5;

    doc.text(`Creata il: ${new Date(dieta.data_creazione).toLocaleDateString()}`, marginLeft, currentY);
    currentY += 10;

    // Stampa giorni
    for (let giornoIndex = 0; giornoIndex < json.data.giorni.length; giornoIndex++) {
      const giorno = json.data.giorni[giornoIndex];
      if (giornoIndex !== 0) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFontSize(12);
      doc.text(`Giorno ${giornoIndex + 1}`, marginLeft, currentY);
      currentY += 8;

      for (const pasto of giorno.pasti) {
        const alimenti = pasto.alimenti || [];
        if (!alimenti.length) continue;

        doc.setFontSize(11);
        doc.text(`${pasto.nome_pasto}`, marginLeft, currentY);
        currentY += 5;

        autoTable(doc, {
          head: [['Alimento', 'Quantità (g)', 'Kcal', 'Proteine (g)', 'Carboidrati (g)', 'Grassi (g)']],
          body: alimenti.map(al => {
            const alimentoDB = alimentiDB.find(f => f.id === al.alimento_id) || {};
            return [
              alimentoDB.nome || al.nome || '—',
              al.quantita || 0,
              (al.energia_kcal || 0).toFixed(1),
              (al.proteine || 0).toFixed(1),
              (al.carboidrati || 0).toFixed(1),
              (al.lipidi_totali || 0).toFixed(1)
            ];
          }),
          startY: currentY,
          theme: 'striped',
          styles: { fontSize: 9 },
          margin: { left: marginLeft, right: 10 },
          didDrawPage: (data) => {
            currentY = data.cursor.y + 10;
          }
        });
      }

      // Totali del giorno
      const totGiorno = giorno.pasti.flatMap(p => p.alimenti || []).reduce((acc, al) => ({
        kcal: acc.kcal + (parseFloat(al.energia_kcal) || 0),
        proteine: acc.proteine + (parseFloat(al.proteine) || 0),
        grassi: acc.grassi + (parseFloat(al.lipidi_totali) || 0),
        carboidrati: acc.carboidrati + (parseFloat(al.carboidrati) || 0)
      }), { kcal: 0, proteine: 0, grassi: 0, carboidrati: 0 });

      doc.setFontSize(10);
      doc.text(
        `Totale: ${totGiorno.kcal.toFixed(1)} kcal – ` +
        `${totGiorno.proteine.toFixed(1)}g P – ${totGiorno.grassi.toFixed(1)}g G – ${totGiorno.carboidrati.toFixed(1)}g C`,
        marginLeft,
        currentY
      );
      currentY += 10;
    }

    // Salva PDF
    doc.save(`${dieta.nome_dieta || dieta.nome || 'dieta'}.pdf`);
  } catch (err) {
    console.error(err);
    toast.error("❌ Errore nella generazione PDF");
  }
};

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          Diete di {pazienteAttivo?.nome?.toUpperCase() || '...'}
        </h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={handleCreaDieta}
        >
          ➕ Crea nuova dieta
        </button>
      </div>

      {diete.length === 0 ? (
        <p className="text-gray-500">Nessuna dieta trovata per questo paziente.</p>
      ) : (
        <ul className="space-y-4">
          {diete.map((dieta) => (
            <li
              key={dieta.id}
              className="border rounded-lg p-4 shadow hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div
                  onClick={() => navigate(`/dieta/${dieta.id}`)}
                  className="cursor-pointer"
                >
                  <h2 className="text-lg font-semibold">
                    {dieta.nome_dieta || dieta.nome}
                    {dieta.sub_index ? `-${String.fromCharCode(96 + dieta.sub_index + 1)}` : ''}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Creata il {new Date(dieta.data_creazione).toLocaleDateString()}
                  </p>
                  {dieta.visita_data ? (
                    <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">
                      Collegata a visita del {new Date(dieta.visita_data).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-400 text-black rounded text-xs">
                      Non collegata a visita
                    </span>
                  )}
                </div>
                <button
onClick={() => stampaDietaPDF(dieta, pazienteAttivo)}
                  className="text-sm px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white ml-4"
                  title="Stampa PDF"
                >
                  🖨 PDF
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
