import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportComparePDF = ({
  /** ID dell’elemento DOM da convertire in PDF */
  targetId = 'compareTable',
  /** Nome del file PDF da scaricare */
  fileName = 'export.pdf',
  /** Testo del pulsante */
  buttonLabel = 'Esporta in PDF',
  /** Stile extra per il pulsante */
  styleButton = {}
}) => {
  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      console.error(`Elemento con id="${targetId}" non trovato nel DOM!`);
      return;
    }

    try {
      // Converte in canvas la sezione HTML corrispondente a targetId
      const canvas = await html2canvas(element);
      // Crea PDF
      const pdf = new jsPDF('p', 'pt', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Calcola proporzioni per adattare l'immagine alla larghezza del PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Inserisce l'immagine nel PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error);
    }
  };

  return (
    <button
      onClick={handleExport}
      style={{
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        marginBottom: '20px',
        ...styleButton
      }}
    >
      {buttonLabel}
    </button>
  );
};

export default ExportComparePDF;
