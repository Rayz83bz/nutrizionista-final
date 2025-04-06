import React from 'react';

const DietePaziente = ({ pazienteId }) => {
  return (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-2">Diete Associate</h3>
      <p>In questa sezione potrai consultare o assegnare diete al paziente con ID {pazienteId}.</p>
    </div>
  );
};

export default DietePaziente;
