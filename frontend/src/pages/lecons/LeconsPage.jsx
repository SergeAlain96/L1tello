import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import { cacheLecons, cacheMatieres } from '../../services/offlineCache';
import { BookOpen, Upload, Archive, FileText, Puzzle, ArrowRight } from 'lucide-react';

const container = { animate: { transition: { staggerChildren: 0.06 } } };
const card = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function LeconsPage() {
  const [lecons, setLecons] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [filtre, setFiltre] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([cacheLecons(API), cacheMatieres(API)])
      .then(([lecRes, matRes]) => { setLecons(lecRes.data); setMatieres(matRes.data); })
      .finally(() => setLoading(false));
  }, []);

  const leconsFiltrees = filtre ? lecons.filter((l) => l.matiere === parseInt(filtre)) : lecons;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="relative"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} /></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <BookOpen size={28} className="text-indigo-600" /> Leçons
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{lecons.length} leçon(s) disponible(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/upload"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2">
              <Upload size={16} /> Ajouter un PDF
            </Link>
          </motion.div>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none bg-white shadow-sm transition-all hover:border-indigo-300">
            <option value="">Toutes les matières</option>
            {matieres.map((m) => <option key={m.id} value={m.id}>{m.icone} {m.nom} ({m.nb_lecons})</option>)}
          </select>
        </div>
      </motion.div>

      {leconsFiltrees.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 text-gray-400">
          <span className="block mb-4 flex justify-center text-gray-300"><Archive size={56} /></span>
          <p className="text-lg font-medium">Aucune leçon trouvée</p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="initial" animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {leconsFiltrees.map((l) => (
            <motion.div key={l.id} variants={card} whileHover={{ y: -6, transition: { duration: 0.2 } }}>
              <Link to={`/lecons/${l.id}`}
                className="block bg-white border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-800 group-hover:text-indigo-700 pr-2 transition-colors">{l.titre}</h3>
                  <span className="shrink-0 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                    {l.niveau}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-2 font-medium">{l.matiere_nom}</p>
                <div className="flex gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg"><FileText size={12} /> {l.nb_notions} notions</span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg"><Puzzle size={12} /> {l.nb_exercices} exercices</span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50">
                  <span className="text-xs text-indigo-500 font-semibold group-hover:text-indigo-700 flex items-center gap-1 transition-colors">
                    Ouvrir le lecteur <span className="group-hover:translate-x-1 transition-transform"><ArrowRight size={14} /></span>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
