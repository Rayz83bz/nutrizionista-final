import { useState } from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

export default function FoodCompare({ selectedFoods, onClose }) {
  const [visibleColumns, setVisibleColumns] = useState(new Set(Object.keys(selectedFoods[0] || {}).filter(key => key !== "id" && key !== "nome")));

  const toggleColumn = (column) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      newSet.has(column) ? newSet.delete(column) : newSet.add(column);
      return newSet;
    });
  };

  if (selectedFoods.length === 0) return null;

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Confronto alimenti selezionati</h2>

      <div className="flex gap-2 mb-4">
        {Object.keys(selectedFoods[0] || {}).filter(key => key !== "id" && key !== "nome").map(col => (
          <button 
            key={col} 
            className={`px-3 py-1 rounded ${visibleColumns.has(col) ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`} 
            onClick={() => toggleColumn(col)}
          >
            {col.replace(/_/g, " ").toUpperCase()}
          </button>
        ))}
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">Parametro</th>
            {selectedFoods.map(food => (
              <th key={food.id} className="border p-2">{food.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from(visibleColumns).map(col => (
            <tr key={col}>
              <td className="border p-2 font-semibold">{col.replace(/_/g, " ").toUpperCase()}</td>
              {selectedFoods.map(food => (
                <td key={`${food.id}-${col}`} className="border p-2">{food[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="text-lg font-semibold mt-6">Distribuzione dei Macronutrienti</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {selectedFoods.map(food => (
          <div key={food.id} className="p-4 shadow-md rounded-lg border">
            <h4 className="font-semibold text-center">{food.nome}</h4>
            <Pie
              data={{
                labels: ["Proteine", "Carboidrati", "Grassi"],
                datasets: [{
                  data: [food.proteine || 0, food.carboidrati || 0, food.lipidi_totali || 0],
                  backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
                }]
              }}
            />
          </div>
        ))}
      </div>

      <button onClick={onClose} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Chiudi</button>
    </div>
  );
}
