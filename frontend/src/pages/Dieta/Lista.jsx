import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ListaDietePaziente() {
  const { idPaziente } = useParams();
  const [diete, setDiete] = useState([]);
  const [paziente, setPaziente] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/diete`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const filtrate = data.data.filter(d => d.paziente_id === parseInt(idPaziente));
          setDiete(filtrate);
          if (filtrate.length > 0) {
            setPaziente(`${filtrate[0].nome_paziente} ${filtrate[0].cognome_paziente}`);
          }
        }
      });
  }, [idPaziente]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Diete di {paziente || '...'}</h1>

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
                    {dieta.nome} {dieta.sub_index ? `-${String.fromCharCode(96 + dieta.sub_index + 1)}` : ''}
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
