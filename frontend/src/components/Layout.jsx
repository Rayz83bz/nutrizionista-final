import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaHome, FaUtensils, FaAppleAlt, FaUserFriends, FaCalculator, FaCog, FaUserCircle, FaNotesMedical, FaListAlt } from 'react-icons/fa';
import { usePaziente } from '../App';

export default function Layout() {
  const { pazienteAttivo, deseleziona } = usePaziente();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const tema = localStorage.getItem('tema_attivo') || 'palette_default';
    document.body.className = tema;
  }, []);

  const pathname = location.pathname;
const paginaAccessibileSenzaPaziente =
  [
    '/', 
    '/pazienti',
    '/pazienti/nuovo',
    '/impostazioni',
    '/alimenti'
  ].includes(pathname) ||
  /^\/pazienti\/\d+\/modifica$/.test(pathname); // più robusto

  const bloccareAccesso = !pazienteAttivo && !paginaAccessibileSenzaPaziente;

const menuItems = [
  { to: '/', icon: <FaHome />, label: 'Dashboard', libero: true },
  { to: '/pazienti', icon: <FaUserFriends />, label: 'Pazienti', libero: true },
  { to: '/dati-evolutivi', icon: <FaUserCircle />, label: 'Dati Evolutivi' },
  { to: '/alimenti', icon: <FaAppleAlt />, label: 'Database Alimenti', libero: true },
  { to: '/diete', icon: <FaUtensils />, label: 'Diete' },
  pazienteAttivo && {
    to: `/diete/paziente/${pazienteAttivo.id}`,
    icon: <FaListAlt />,
    label: 'Diete Paziente',
    libero: false
  },
  { to: '/fabbisogni', icon: <FaCalculator />, label: 'Fabbisogni' },
  { to: '/impostazioni', icon: <FaCog />, label: 'Impostazioni', libero: true }
].filter(Boolean); // ← utile per rimuovere voci "false" se paziente non attivo


  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-blue-500 mb-10 text-center">Rayz Dietometer</h1>
<nav className="flex flex-col gap-2 text-sm"> {/* gap da 4 → 2 e testo + compatto */}
          {menuItems.map(({ to, icon, label, libero }) => {
            const accessibile = libero || !!pazienteAttivo;

            return (
              <a
                key={to}
                href={accessibile ? to : '#'}
                className={`flex items-center justify-between px-2 py-2 rounded transition
                  ${accessibile ? 'text-gray-700 hover:text-blue-600' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={(e) => {
                  if (!accessibile) e.preventDefault();
                }}
              >
                <span className="flex items-center gap-2">
                  {icon} {label}
                </span>
                {libero ? (
                  <span className="text-green-500">✔</span>
                ) : !pazienteAttivo ? (
                  <span className="text-red-400">🔒</span>
                ) : null}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Contenuto */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white shadow px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-semibold whitespace-nowrap">Paziente attivo:</span>
            {pazienteAttivo ? (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full">
                <span className="font-semibold">
                  {pazienteAttivo.nome} {pazienteAttivo.cognome} ({pazienteAttivo.data_nascita})
                </span>
                <button
                  onClick={deseleziona}
                  title="Deseleziona paziente"
                  className="text-red-500 hover:text-red-700 font-bold"
                >
                  ❌
                </button>
              </div>
            ) : (
              <span className="italic text-gray-500">Nessuno</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Benvenuto, <span className="font-semibold text-gray-700">Dott. Lucio La Rizza</span>
          </div>
        </header>

        {/* Corpo pagina */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {bloccareAccesso ? (
            <div className="text-center text-red-600 mt-10 text-lg font-medium">
              ⚠️ Selezionare un paziente prima di accedere all’area desiderata.
              <div className="mt-6">
                <button
                  onClick={() => navigate('/pazienti')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Vai ai Pazienti
                </button>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
