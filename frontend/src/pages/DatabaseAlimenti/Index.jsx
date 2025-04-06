import React, { useEffect, useState } from 'react';
import FoodTable from '../../components/FoodTable';
import FoodDetailsModal from '../../components/FoodDetailsModal';
import FoodCompareMulti from '../../components/FoodCompareMulti';

export default function DatabaseAlimentiPage() {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedCompare, setSelectedCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/database-alimenti')
      .then((res) => res.json())
      .then((data) => {
        setFoods(data);
        setFilteredFoods(data);
      });
  }, []);

  useEffect(() => {
    const filtered = foods.filter((item) =>
      item.nome.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredFoods(filtered);
  }, [search, foods]);

  const toggleCompareFood = (food) => {
    setSelectedCompare((prev) => {
      if (prev.find((f) => f.id === food.id)) {
        return prev.filter((f) => f.id !== food.id);
      } else {
        return [...prev, food];
      }
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Database Alimenti</h1>
      <input
        type="text"
        placeholder="Cerca alimento..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <button
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => setShowCompareModal(true)}
        disabled={selectedCompare.length === 0}
      >
        Apri confronto ({selectedCompare.length})
      </button>
      <FoodTable
        data={filteredFoods}
        onDetailsClick={(food) => setSelectedFood(food)}
        onCompareClick={toggleCompareFood}
        selectedCompare={selectedCompare}
      />
      {selectedFood && (
        <FoodDetailsModal
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
      {showCompareModal && (
        <FoodCompareMulti
          selectedFoods={selectedCompare}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}
