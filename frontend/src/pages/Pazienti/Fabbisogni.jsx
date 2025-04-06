import React from 'react';

const FabbisogniPaziente = ({ pazienteId }) => {
  return (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-2">Calcolo Fabbisogni</h3>
      <p>In questa sezione potrai calcolare e visualizzare i fabbisogni nutrizionali per il paziente con ID {pazienteId}.</p>
    </div>
  );
};

export default FabbisogniPaziente;
