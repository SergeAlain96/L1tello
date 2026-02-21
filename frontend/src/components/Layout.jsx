import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import useOffline from '../hooks/useOffline';
import API from '../api/axios';
import {
  LayoutDashboard, BookOpen, Upload, Puzzle, Brain,
  GraduationCap, Zap, RefreshCw, School, Library,
  LogOut, WifiOff, Loader2
} from 'lucide-react';

import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { online, syncing, pendingCount, manualSync } = useOffline(API);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTuteur = user?.role === 'tuteur';
  const peutUploader = user?.peut_uploader;

  const NAV_ITEMS = isTuteur
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { to: '/lecons', label: 'Leçons', icon: <BookOpen size={20} /> },
        { to: '/upload', label: 'Ajouter PDF', icon: <Upload size={20} /> },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { to: '/lecons', label: 'Mes Leçons', icon: <BookOpen size={20} /> },
        ...(peutUploader ? [{ to: '/upload', label: 'Ajouter PDF', icon: <Upload size={20} /> }] : []),
        { to: '/quiz', label: 'Quiz', icon: <Puzzle size={20} /> },
        { to: '/revision', label: 'Révision IA', icon: <Brain size={20} /> },
      ];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Banners ── */}
      <AnimatePresence>
        {!online && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2.5 text-sm font-semibold shadow-lg">
            <span className="flex items-center justify-center gap-2"><WifiOff size={16} /> Mode hors-ligne — Les données en cache sont utilisées</span>
          </motion.div>
        )}
        {syncing && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center py-2.5 text-sm font-semibold shadow-lg">
            <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Synchronisation en cours…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      {/* Mobile burger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-2 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Ouvrir le menu"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>

      <aside
        className={`
          w-72 fixed h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-r border-white/[0.06]
          transition-transform duration-300 z-40
          md:translate-x-0
          ${!online || syncing ? 'mt-10' : ''}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:block md:mt-0
        `}
        style={{ minWidth: '16rem' }}
      >
        {/* Logo */}
        <div className="p-6 pb-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <motion.span whileHover={{ rotate: 12, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }} className="text-indigo-400"><GraduationCap size={28} /></motion.span>
            <div>
              <span className="text-xl font-extrabold gradient-text">L1tello</span>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-indigo-400/50 font-medium">Tuteur Intelligent</p>
                <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`} />
              </div>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 mt-2">
          {NAV_ITEMS.map((item, i) => {
            const active = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
            return (
              <motion.div key={item.to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 + 0.1 }}>
                <Link to={item.to}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative
                    ${active
                      ? 'bg-indigo-500/15 text-indigo-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {active && (
                    <motion.div layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-lg shadow-indigo-500/50"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                  )}
                  <span className="group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                  <span>{item.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-4">
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
                {user?.first_name?.[0] || user?.username?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">
                  {user?.first_name || user?.username}
                </p>
                <p className="text-[11px] text-indigo-400/60 capitalize font-medium flex items-center gap-1">
                  {user?.role === 'tuteur' ? <><School size={12} /> Tuteur</> : <><Library size={12} /> Élève</>}
                </p>
              </div>
            </div>
            {pendingCount > 0 && (
              <motion.button onClick={manualSync} disabled={!online || syncing}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 py-2 rounded-xl transition-all mb-2 disabled:opacity-50 cursor-pointer border border-amber-500/20">
                <span className="flex items-center justify-center gap-1"><RefreshCw size={12} /> {pendingCount} action{pendingCount > 1 ? 's' : ''} en attente</span>
              </motion.button>
            )}
            <motion.button onClick={handleLogout} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full text-xs text-red-400/70 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 py-2.5 rounded-xl transition-all cursor-pointer border border-red-500/10 hover:border-red-500/20">
              <span className="flex items-center justify-center gap-1"><LogOut size={14} /> Déconnexion</span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main
        className={`flex-1 bg-classroom min-h-screen transition-all duration-300
          md:ml-72 ${!online || syncing ? 'mt-10' : ''}
        `}
      >
        <div className="p-2 sm:p-4 md:p-8">
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
