import { useEffect, useState } from 'react';

export default function ColumnsSelector({ allColumns, selectedColumns, setSelectedColumns }) {
  const MANDATORY_COLUMNS = ['nome'];

  const toggleColumn = (col) => {
    if (MANDATORY_COLUMNS.includes(col)) return;
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-md">
      <h3 className="text-lg font-semibold mb-2">Seleziona le colonne da visualizzare</h3>
      <button
        onClick={() => setSelectedColumns(allColumns)}
        className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
      >
        Mostra tutte
      </button>
      <button
        onClick={() => setSelectedColumns(MANDATORY_COLUMNS)}
        className="bg-gray-500 text-white px-3 py-1 rounded"
      >
        Nascondi tutte tranne nome
      </button>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {allColumns.map(col => (
          <label key={col} className="block">
            <input
              type="checkbox"
              checked={selectedColumns.includes(col)}
              onChange={() => toggleColumn(col)}
              className="mr-2"
            />
            {col}
          </label>
        ))}
      </div>
    </div>
  );
}
