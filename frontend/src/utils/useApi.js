import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default function useApi() {
  const [loading, setLoading] = useState(false);

  const request = async (config, successMessage = 'Operazione completata!') => {
    try {
      setLoading(true);
      const response = await api(config);
      toast.success(successMessage);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Errore imprevisto';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
export async function selezionaPazienteDaQuery(setPazienteAttivo) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('for');
  if (id) {
    try {
      const res = await fetch(`http://localhost:5000/api/pazienti/${id}`);
      if (res.ok) {
        const paziente = await res.json();
        localStorage.setItem('pazienteAttivo', JSON.stringify(paziente));
        if (setPazienteAttivo) setPazienteAttivo(paziente);
      }
    } catch (e) {
      console.error("Errore caricamento paziente via query:", e);
    }
  }
}

  return { request, loading };
}
