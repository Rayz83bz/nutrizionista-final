import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function FoodCompareMulti({ selectedFoods, onClose }) {
  if (!selectedFoods.length) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl w-full overflow-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-6 text-center">Confronto alimenti selezionati</h2>

        {/* Grafici in cima */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {selectedFoods.map((food) => (
            <div key={food.id} className="text-center border p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">{food.nome}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={[
                      { name: 'Proteine', value: food.proteine },
                      { name: 'Grassi', value: food.lipidi_totali },
                      { name: 'Carboidrati', value: food.carboidrati },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>

        {/* Tabella di confronto sotto */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Parametro</th>
                {selectedFoods.map((food) => (
                  <th key={food.id} className="p-2 text-left">{food.nome}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(selectedFoods[0])
                .filter((key) => key !== 'id' && key !== 'nome' && key !== 'categoria')
                .map((key) => (
                  <tr key={key} className="border-b">
                    <td className="p-2 font-semibold">{key.replace(/_/g, ' ').toUpperCase()}</td>
                    {selectedFoods.map((food) => (
                      <td key={food.id + key} className="p-2">{food[key]}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
