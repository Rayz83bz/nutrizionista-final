import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ProgressChart = ({ progressData }) => {
  // Supponiamo che progressData sia un array di oggetti con { data_misurazione, peso }
  const data = {
    labels: progressData.map(item => item.data_misurazione),
    datasets: [
      {
        label: 'Peso (kg)',
        data: progressData.map(item => item.peso),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Andamento del Peso nel Tempo' }
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default ProgressChart;
