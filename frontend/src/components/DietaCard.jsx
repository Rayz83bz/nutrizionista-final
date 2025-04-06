// /components/DietaCard.jsx
import React from 'react';

export default function DietaCard({ dieta }) {
  return (
    <div className="border p-4 rounded shadow-md">
      <h3 className="text-lg font-semibold">{dieta.name}</h3>
      <p>{dieta.description}</p>
      <p>Calorie: {dieta.calories}</p>
      <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2">Modifica</button>
    </div>
  );
}
