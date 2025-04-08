import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaziente } from '../../App';
import toast from 'react-hot-toast';

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
              className="border rounded-lg p-4 shadow hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/dieta/${dieta.id}`)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">
                    {dieta.nome_dieta || dieta.nome}
                    {dieta.sub_index ? `-${String.fromCharCode(96 + dieta.sub_index + 1)}` : ''}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Creata il {new Date(dieta.data_creazione).toLocaleDateString()}
                  </p>
                </div>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
