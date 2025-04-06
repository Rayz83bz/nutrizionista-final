// FoodSearchBar.jsx
import React from 'react';

const FoodSearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <input
      type="text"
      placeholder="Cerca alimento..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{
        width: '100%',
        padding: '8px',
        marginBottom: '15px',
        fontSize: '0.9rem',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}
    />
  );
};

export default FoodSearchBar;
