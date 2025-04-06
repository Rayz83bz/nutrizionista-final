import React from 'react';

export default function SidebarAlimenti({ categorie, onSelectCategory }) {
  if (!categorie || !Array.isArray(categorie) || categorie.length === 0) {
    return (
      <div style={{ padding: '10px', borderRight: '1px solid #ccc', width: '200px' }}>
        <h3>Categorie</h3>
        <p style={{ fontStyle: 'italic', color: '#777' }}>Nessuna categoria trovata.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', borderRight: '1px solid #ccc', width: '200px' }}>
      <h3>Categorie</h3>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {categorie.map((categoria, index) => (
          <li key={index} style={{ marginBottom: '10px' }}>
            <button
              style={{ width: '100%', padding: '5px', cursor: 'pointer' }}
              onClick={() => onSelectCategory(categoria)}
            >
              {categoria}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
