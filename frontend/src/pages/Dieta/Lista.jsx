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

  const stampaDietaPDF = async (dieta) => {
    try {
      const res = await fetch(`http://localhost:5000/api/diete/dettaglio/${dieta.id}`);
      const json = await res.json();
      if (!json.success || !json.data || !json.data.giorni) {
        toast.error("❌ Dieta non valida per la stampa");
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Dieta: ${dieta.nome_dieta || dieta.nome}`, 10, 15);
      doc.setFontSize(10);
      doc.text(`Paziente: ${pazienteAttivo?.nome || 'N/A'} ${pazienteAttivo?.cognome || ''}`, 10, 22);
      doc.text(`Data creazione: ${new Date(dieta.data_creazione).toLocaleDateString()}`, 10, 27);

json.data.giorni.forEach((giorno, giornoIndex) => {
  doc.addPage();
  doc.setFontSize(12);
  doc.text(`Giorno ${giornoIndex + 1}`, 10, 15);

  let currentY = 25;

  giorno.pasti.forEach((pasto) => {
    const alimenti = pasto.alimenti || [];
    if (alimenti.length > 0) {
      autoTable(doc, {
        head: [[`🍽 ${pasto.nome_pasto}`, 'Quantità (g)', 'Kcal', 'Proteine', 'Carboidrati', 'Grassi']],
        body: alimenti.map(al => [
          al.nome || '—',
          al.quantita,
          al.energia_kcal,
          al.proteine,
          al.carboidrati,
          al.lipidi_totali
        ]),
        startY: currentY,
        styles: { fontSize: 9 },
        didDrawPage: (data) => {
          currentY = data.cursor.y + 5; // aggiorna per il prossimo pasto
        }
      });
    }
  });
});


      doc.save(`${dieta.nome_dieta || dieta.nome}.pdf`);
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
                  onClick={() => stampaDietaPDF(dieta)}
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
