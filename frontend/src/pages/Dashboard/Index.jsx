import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaUserFriends,
  FaAppleAlt,
  FaUtensils,
  FaChartLine
} from 'react-icons/fa';

export default function Dashboard() {
  const [stats, setStats] = useState({
    pazienti: 0,
    alimenti: 0,
    diete: 0,
    progressi: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pazientiRes, alimentiRes] = await Promise.all([
          fetch('http://localhost:5000/api/pazienti/count'),
          fetch('http://localhost:5000/api/database-alimenti/ultimo-id')
        ]);

        const pazienti = await pazientiRes.json();
        const alimenti = await alimentiRes.json();

        console.log("📊 Pazienti:", pazienti);
        console.log("📊 Alimenti:", alimenti);

        setStats({
          pazienti: pazienti.total || 0,
          alimenti: alimenti.ultimoId || 0,
          diete: 0, // disabilitati per ora
          progressi: 0
        });
      } catch (err) {
        console.error('❌ Errore nel recupero delle statistiche:', err);
      }
    };

    fetchStats();
  }, []);

  const cardData = [
    { icon: <FaUserFriends />, label: 'Pazienti attivi', value: stats.pazienti },
    { icon: <FaAppleAlt />, label: 'Alimenti in DB', value: stats.alimenti },
    { icon: <FaUtensils />, label: 'Piani dieta creati', value: stats.diete },
    { icon: <FaChartLine />, label: 'Progressi monitorati', value: stats.progressi },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white shadow-soft rounded-2xl p-6 flex flex-col items-center justify-center text-center"
          >
            <div className="text-4xl text-blue-500 mb-4">{stat.icon}</div>
            <div className="text-2xl font-semibold">{stat.value}</div>
            <div className="text-gray-500 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
