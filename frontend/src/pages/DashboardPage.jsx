import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { cacheDashboard } from '../services/offlineCache';
import {
  School, BookOpen, Users, FileText, Target, Zap, Upload,
  Trophy, TrendingUp, Star, CheckCircle2, XCircle,
  Archive, Puzzle, ArrowRight, BarChart3, BookOpenCheck
} from 'lucide-react';

const fadeUp = (i = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] } });
const container = { animate: { transition: { staggerChildren: 0.07 } } };
const child = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    cacheDashboard(API).then((r) => { setData(r.data); setFromCache(r.fromCache); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="relative"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} /></div>
    </div>
  );

  const role = data?.role || user?.role || 'eleve';
  if (role === 'tuteur') return <TuteurDashboard data={data} user={user} fromCache={fromCache} />;
  return <EleveDashboard data={data} user={user} fromCache={fromCache} />;
}

function StatCard({ icon, label, value, gradient, delay = 0 }) {
  return (
    <motion.div {...fadeUp(delay)}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl p-5 ${gradient} shadow-lg`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-center gap-4">
        <span className="text-white/90">{icon}</span>
        <div>
          <p className="text-2xl font-extrabold text-white">{value}</p>
          <p className="text-xs text-white/70 font-medium">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

function TuteurDashboard({ data, user, fromCache }) {
  const stats = data?.stats || {};
  const lecons = data?.lecons_disponibles || [];
  const topEleves = data?.top_eleves || [];

  return (
    <motion.div initial="initial" animate="animate" className="space-y-8">
      {/* Hero */}
      <motion.div {...fadeUp(0)} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <h1 className="text-3xl font-extrabold">Bonjour, {user?.first_name || user?.username}</h1>
          <p className="text-indigo-100/80 mt-2 text-sm">Voici le suivi de vos leçons et élèves
            {fromCache && <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">Cache</span>}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BookOpen size={28} />} label="Leçons créées" value={stats.lecons_creees || 0} gradient="bg-gradient-to-br from-indigo-500 to-indigo-700" delay={1} />
        <StatCard icon={<Users size={28} />} label="Élèves actifs" value={stats.total_eleves || 0} gradient="bg-gradient-to-br from-blue-500 to-cyan-600" delay={2} />
        <StatCard icon={<FileText size={28} />} label="Tentatives total" value={stats.total_tentatives || 0} gradient="bg-gradient-to-br from-violet-500 to-purple-700" delay={3} />
        <StatCard icon={<Target size={28} />} label="Taux réussite" value={`${stats.taux_reussite_global || 0}%`} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" delay={4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions rapides */}
        <motion.div {...fadeUp(5)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <Link to="/upload" className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl hover:from-indigo-100 hover:to-violet-100 transition-all group">
              <span className="text-indigo-600 group-hover:scale-110 transition-transform"><Upload size={24} /></span>
              <div><p className="font-semibold text-indigo-700">Ajouter une leçon</p><p className="text-xs text-indigo-500/70">Uploader un nouveau PDF</p></div>
              <span className="ml-auto text-indigo-400 group-hover:translate-x-1 transition-transform"><ArrowRight size={18} /></span>
            </Link>
            <Link to="/lecons" className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl hover:from-purple-100 hover:to-pink-100 transition-all group">
              <span className="text-purple-600 group-hover:scale-110 transition-transform"><BookOpen size={24} /></span>
              <div><p className="font-semibold text-purple-700">Gérer mes leçons</p><p className="text-xs text-purple-500/70">Voir et organiser le contenu</p></div>
              <span className="ml-auto text-purple-400 group-hover:translate-x-1 transition-transform"><ArrowRight size={18} /></span>
            </Link>
          </div>
        </motion.div>

        {/* Top élèves */}
        <motion.div {...fadeUp(6)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Meilleurs élèves</h2>
          {topEleves.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><span className="block mb-3 flex justify-center"><Users size={48} /></span><p className="text-sm">Aucun élève n'a encore commencé</p></div>
          ) : (
            <motion.div variants={container} initial="initial" animate="animate" className="space-y-2">
              {topEleves.map((e, i) => (
                <motion.div key={e.eleve__id} variants={child} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50/50 rounded-xl transition-colors">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-600'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{e.eleve__first_name || e.eleve__username}</p>
                    <p className="text-xs text-gray-400">{e.nb_tentatives} exercice(s)</p></div>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{Math.round(e.score_moyen || 0)}/100</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Leçons */}
      <motion.div {...fadeUp(7)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Mes leçons</h2>
          <Link to="/upload" className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">+ Ajouter</Link>
        </div>
        {lecons.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><span className="block mb-3 flex justify-center"><Archive size={48} /></span><p className="text-sm">Vous n'avez pas encore créé de leçon</p>
            <Link to="/upload" className="text-indigo-600 text-sm mt-3 inline-block hover:underline font-medium">Ajouter ma première leçon</Link></div>
        ) : (
          <motion.div variants={container} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lecons.map((l) => (
              <motion.div key={l.id} variants={child} whileHover={{ y: -3 }}>
                <Link to={`/lecons/${l.id}`} className="block p-5 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group bg-white">
                  <p className="font-semibold text-gray-800 group-hover:text-indigo-700 truncate transition-colors">{l.titre}</p>
                  <div className="flex items-center gap-2 mt-3"><span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-xs font-medium">{l.matiere_nom}</span>
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs">{l.niveau}</span></div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-400"><span className="flex items-center gap-1"><FileText size={12} /> {l.nb_notions} notions</span><span className="flex items-center gap-1"><Puzzle size={12} /> {l.nb_exercices} exercices</span></div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EleveDashboard({ data, user, fromCache }) {
  const stats = data?.stats || {};
  const notionsReviser = data?.notions_a_reviser || [];
  const recentes = data?.performances_recentes || [];
  const lecons = data?.lecons_disponibles || [];

  return (
    <motion.div initial="initial" animate="animate" className="space-y-8">
      {/* Hero */}
      <motion.div {...fadeUp(0)} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <h1 className="text-3xl font-extrabold">Bonjour, {user?.first_name || user?.username}</h1>
          <p className="text-blue-100/80 mt-2 text-sm">Voici ta progression aujourd'hui
            {fromCache && <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">Cache</span>}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText size={28} />} label="Exercices tentés" value={stats.exercices_tentes || 0} gradient="bg-gradient-to-br from-blue-500 to-blue-700" delay={1} />
        <StatCard icon={<CheckCircle2 size={28} />} label="Réussis" value={stats.exercices_reussis || 0} gradient="bg-gradient-to-br from-emerald-500 to-green-600" delay={2} />
        <StatCard icon={<Target size={28} />} label="Taux de réussite" value={`${stats.taux_reussite || 0}%`} gradient="bg-gradient-to-br from-violet-500 to-purple-700" delay={3} />
        <StatCard icon={<Star size={28} />} label="Score moyen" value={`${stats.score_moyen || 0}/100`} gradient="bg-gradient-to-br from-amber-500 to-orange-600" delay={4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notions à réviser */}
        <motion.div {...fadeUp(5)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Notions à réviser</h2>
          {notionsReviser.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><span className="block mb-3 flex justify-center text-emerald-400"><Trophy size={48} /></span><p className="text-sm">Aucune notion à réviser !</p><p className="text-xs mt-1">Continue comme ça</p></div>
          ) : (
            <motion.ul variants={container} initial="initial" animate="animate" className="space-y-2">
              {notionsReviser.map((n) => (
                <motion.li key={n.id} variants={child} className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100/50 rounded-xl transition-colors">
                  <span className="text-red-500 font-bold text-xs bg-red-100 w-7 h-7 rounded-lg flex items-center justify-center">{n.nb_echecs}×</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{n.titre}</p><p className="text-xs text-gray-400">{n.lecon}</p></div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>

        {/* Activité récente */}
        <motion.div {...fadeUp(6)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Activité récente</h2>
          {recentes.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><span className="block mb-3 flex justify-center"><BookOpenCheck size={48} /></span><p className="text-sm">Aucune activité pour le moment</p><p className="text-xs mt-1">Commence par une leçon !</p></div>
          ) : (
            <motion.div variants={container} initial="initial" animate="animate" className="space-y-2">
              {recentes.map((p) => (
                <motion.div key={p.id} variants={child}
                  className={`flex items-center gap-3 p-3 rounded-xl ${p.est_correcte ? 'bg-emerald-50' : 'bg-red-50'} transition-colors`}>
                  <span className={p.est_correcte ? 'text-emerald-500' : 'text-red-500'}>{p.est_correcte ? <CheckCircle2 size={20} /> : <XCircle size={20} />}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm text-gray-700 truncate">Score : {p.score}/100</p></div>
                  <span className="text-xs text-gray-400 font-medium">{new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Leçons disponibles */}
      <motion.div {...fadeUp(7)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Leçons disponibles</h2>
          <Link to="/lecons" className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">Voir tout</Link>
        </div>
        {lecons.length === 0 ? (
          <div className="text-center py-12 text-gray-400"><span className="block mb-3 flex justify-center"><Archive size={48} /></span><p className="text-sm">Aucune leçon disponible</p></div>
        ) : (
          <motion.div variants={container} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lecons.map((l) => (
              <motion.div key={l.id} variants={child} whileHover={{ y: -3 }}>
                <Link to={`/lecons/${l.id}`} className="block p-5 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group bg-white">
                  <p className="font-semibold text-gray-800 group-hover:text-indigo-700 truncate transition-colors">{l.titre}</p>
                  <div className="flex items-center gap-2 mt-3"><span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-xs font-medium">{l.matiere_nom}</span>
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs">{l.niveau}</span></div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-400"><span className="flex items-center gap-1"><FileText size={12} /> {l.nb_notions} notions</span><span className="flex items-center gap-1"><Puzzle size={12} /> {l.nb_exercices} exercices</span></div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
