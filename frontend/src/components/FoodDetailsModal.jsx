import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function FoodDetailsModal({ food, onClose }) {
  if (!food) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl max-w-3xl w-full overflow-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4 text-center">{food.nome}</h2>

        <h3 className="text-xl font-semibold mb-2 text-center">Composizione Macroalimenti</h3>
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

        <h3 className="text-xl font-semibold mt-6 mb-2">Valori nutrizionali</h3>
        <table className="w-full border-collapse mb-6">
          <tbody>
            {Object.entries(food).map(([key, value]) => (
              key !== 'id' && key !== 'nome' && (
                <tr key={key} className="border-b">
                  <td className="py-1 font-semibold capitalize">{key.replace(/_/g, ' ')}</td>
                  <td className="py-1">{value}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>

        <button
          onClick={onClose}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded block mx-auto"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}
