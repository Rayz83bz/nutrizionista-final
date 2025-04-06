import React, { useEffect, useState, useCallback } from 'react';
import FoodDetailsModal from '../../components/FoodDetailsModal';
import FoodCompareMulti from '../../components/FoodCompareMulti';
import DatabaseAlimentiOnboarding from '../../components/DatabaseAlimentiOnboarding';
import ColumnsSelector from '../../components/ColumnsSelector';

// Colonne obbligatorie
const MANDATORY_COLUMNS = ['nome'];

// Definisci i gruppi di colonne
const COLUMN_GROUPS = {
  Principali: ['nome', 'categoria', 'energia_kcal', 'proteine', 'carboidrati', 'lipidi_totali'],
  Macroelementi: ['acidi_grassi_saturi', 'acidi_grassi_monoinsaturi', 'acidi_grassi_polinsaturi', 'fibra_alimentare', 'zuccheri'],
  Altro: [] // verrà popolato dinamicamente
};

function DatabaseAlimenti() {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [foodToCompare, setFoodToCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [allColumns, setAllColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);

  // Carica gli alimenti dal backend
  useEffect(() => {
    fetch('http://localhost:5000/api/database-alimenti')
      .then((res) => {
        if (!res.ok) throw new Error('Errore nella risposta degli alimenti');
        return res.json();
      })
      .then((data) => {
        setFoods(data);
        setFilteredFoods(data);
        const union = new Set();
        data.forEach((food) => {
          Object.keys(food).forEach((key) => union.add(key));
        });
        union.delete('id');
        const columnsArray = [...union];
        const usedCols = new Set([...COLUMN_GROUPS.Principali, ...COLUMN_GROUPS.Macroelementi]);
        const otherCols = columnsArray.filter(col => !usedCols.has(col));
        COLUMN_GROUPS.Altro = otherCols;
        setAllColumns(columnsArray);
      })
      .catch((err) => {
        console.error('Errore caricamento alimenti:', err);
        setFoods([]);
        setFilteredFoods([]);
      });
  }, []);

  // Usa useCallback per il filtro per evitare warning sulle dipendenze
  const filterFoods = useCallback(() => {
    let result = [...foods];
    if (searchTerm) {
      result = result.filter((f) =>
        f.nome && f.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredFoods(result);
  }, [foods, searchTerm]);

  useEffect(() => {
    filterFoods();
  }, [filterFoods]);

  // Funzioni per la selezione delle colonne
  const toggleColumn = (col) => {
    if (MANDATORY_COLUMNS.includes(col)) return;
    if (selectedColumns.includes(col)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const showAllColumns = () => {
    setSelectedColumns([...new Set([...MANDATORY_COLUMNS, ...allColumns])]);
  };

  const hideAllColumns = () => {
    setSelectedColumns(MANDATORY_COLUMNS);
  };

  // Funzioni per il confronto e i modali
  const handleCompare = (food) => {
    const exists = foodToCompare.find((f) => f.id === food.id);
    if (exists) {
      setFoodToCompare(foodToCompare.filter((f) => f.id !== food.id));
    } else {
      setFoodToCompare([...foodToCompare, food]);
    }
  };

  const openCompareModal = () => {
    if (foodToCompare.length > 1) {
      setShowCompareModal(true);
    } else {
      alert('Seleziona almeno 2 alimenti per il confronto!');
    }
  };

  const closeCompareModal = () => {
    setShowCompareModal(false);
  };

  // Stili per colonne fisse
  const styleNome = {
    maxWidth: '150px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: '6px'
  };
  const styleCategoria = {
    maxWidth: '200px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: '6px'
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <DatabaseAlimentiOnboarding />
      <h1 style={{ marginBottom: '15px' }}>Database Alimenti</h1>
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
          borderRadius: '4px',
        }}
      />
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={() => setShowColumnsPanel(!showColumnsPanel)}
          style={{
            marginRight: '10px',
            padding: '6px 12px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          {showColumnsPanel ? 'Nascondi colonne' : 'Mostra colonne'}
        </button>
        <button
          onClick={openCompareModal}
          style={{
            marginRight: '10px',
            padding: '6px 12px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Apri confronto ({foodToCompare.length})
        </button>
        {foodToCompare.length > 0 && (
          <button
            onClick={() => setFoodToCompare([])}
            style={{
              marginRight: '10px',
              padding: '6px 12px',
              background: '#f87171',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Svuota selezione
          </button>
        )}
      </div>
      {showColumnsPanel && (
        <ColumnsSelector
          mandatoryColumns={MANDATORY_COLUMNS}
          columnGroups={COLUMN_GROUPS}
          selectedColumns={selectedColumns}
          toggleColumn={toggleColumn}
          showAllColumns={showAllColumns}
          hideAllColumns={hideAllColumns}
        />
      )}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr style={{ background: '#f2f2f2' }}>
              {selectedColumns.map((col) => (
                <th
                  key={col}
                  style={{
                    borderBottom: '1px solid #ccc',
                    textAlign: 'left',
                    padding: '6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {col}
                </th>
              ))}
              <th style={{ borderBottom: '1px solid #ccc', padding: '6px' }}>
                Azioni
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFoods.map((food) => {
              const isSelected = foodToCompare.some((f) => f.id === food.id);
              return (
                <tr key={food.id} style={{ borderBottom: '1px solid #eee' }}>
                  {selectedColumns.map((col) => {
                    if (col === 'nome') {
                      return (
                        <td key={col} style={styleNome} title={food[col]}>
                          {food[col] ?? '-'}
                        </td>
                      );
                    } else if (col === 'categoria') {
                      return (
                        <td key={col} style={styleCategoria} title={food[col]}>
                          {food[col] ?? '-'}
                        </td>
                      );
                    } else {
                      return (
                        <td key={col} style={{ padding: '6px', overflow: 'hidden' }}>
                          {food[col] ?? '-'}
                        </td>
                      );
                    }
                  })}
                  <td style={{ padding: '6px', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => setSelectedFood(food)}
                      style={{
                        marginRight: '4px',
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                        background: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => handleCompare(food)}
                      style={{
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                        background: isSelected ? '#f87171' : '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {isSelected ? 'Rimuovi' : 'Confronta'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedFood && (
        <FoodDetailsModal
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
      {showCompareModal && (
        <FoodCompareMulti
          foods={foodToCompare}
          onClose={closeCompareModal}
        />
      )}
    </div>
  );
}

export default DatabaseAlimenti;
