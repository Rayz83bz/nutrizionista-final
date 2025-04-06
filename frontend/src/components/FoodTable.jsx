import React from 'react';

export default function FoodTable({ data, onDetailsClick, onCompareClick, selectedCompare = [] }) {
  if (!Array.isArray(data) || data.length === 0) return <p>Nessun alimento trovato.</p>;

  const columns = ['nome', 'categoria', 'energia_kcal', 'proteine', 'carboidrati', 'lipidi_totali'];

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 text-left">{col}</th>
            ))}
            <th className="px-4 py-2">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {data.map((food) => (
            <tr key={food.id} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="px-4 py-2">{food[col]}</td>
              ))}
              <td className="px-4 py-2 space-x-2">
                <button
                  onClick={() => onDetailsClick(food)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Dettagli
                </button>
                <button
                  onClick={() => onCompareClick(food)}
                  className={`${
                    selectedCompare.find((f) => f.id === food.id)
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white px-3 py-1 rounded`}
                >
                  {selectedCompare.find((f) => f.id === food.id) ? 'Rimuovi' : 'Confronta'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
