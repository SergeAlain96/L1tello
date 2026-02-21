import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Trophy, TrendingUp, CheckCircle2, XCircle,
  RefreshCw, BarChart3, Lightbulb, Rocket, BookOpen,
  Target, FileText, GraduationCap, Flag
} from 'lucide-react';

const fadeUp = (d = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { delay: d, duration: 0.5 } },
});

export default function RevisionPage() {
  const { user } = useAuth();
  const [profil, setProfil] = useState(null);
  const [exercices, setExercices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quiz adaptatif state
  const [mode, setMode] = useState('profil'); // 'profil' | 'quiz'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    Promise.all([
      API.get('/revision/profil/'),
      API.get('/revision/exercices/'),
    ])
      .then(([profilRes, exRes]) => {
        setProfil(profilRes.data);
        setExercices(exRes.data.exercices || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Start quiz adaptatif ──
  const startQuiz = () => {
    if (exercices.length === 0) return;
    setMode('quiz');
    setCurrentIndex(0);
    setSelected(null);
    setSubmitted(false);
    setFeedback('');
    setResults([]);
    setFinished(false);
    setStartTime(Date.now());
  };

  const currentRec = exercices[currentIndex];
  const currentExo = currentRec?.exercice;

  const handleSelect = (index) => {
    if (submitted) return;
    setSelected(index);
  };

  const handleSubmit = async () => {
    if (selected === null || submitted) return;
    const choix = currentExo.choix || [];
    const isCorrect = choix[selected]?.correct === true;
    const elapsedMs = Date.now() - startTime;

    setSubmitted(true);
    setResults((prev) => [...prev, { question: currentExo.question, est_correcte: isCorrect }]);

    try {
      const res = await API.post('/revision/enregistrer/', {
        exercice: currentExo.id,
        reponse_donnee: { index: selected, texte: choix[selected]?.texte },
        est_correcte: isCorrect,
        score: isCorrect ? 100 : 0,
        temps_reponse: `${Math.floor(elapsedMs / 1000)}`,
      });
      setFeedback(res.data.feedback || '');
    } catch {
      // silent
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= exercices.length) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setSubmitted(false);
      setFeedback('');
      setStartTime(Date.now());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600"
        />
      </div>
    );
  }

  // Wrapper responsive global
  return (
    <div className="px-1 sm:px-2 md:px-0">
      {/* ...existing code... */}
      {(() => {
        // ...toute la logique de rendu existante...
        // Remplacer tous les retours JSX principaux par leur version enveloppée dans ce div
        // Adapter la grille des résultats ci-dessous

  const fb = profil?.feedback || {};
  const maitrise = profil?.maitrise || [];

  // ════════════════════════════════════════
  // Mode QUIZ adaptatif terminé
  // ════════════════════════════════════════
  if (mode === 'quiz' && finished) {
    const total = results.length;
    const ok = results.filter((r) => r.est_correcte).length;
    const taux = total > 0 ? Math.round((ok / total) * 100) : 0;

    return (
      <motion.div className="max-w-2xl mx-auto space-y-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }} className="block mb-4 flex justify-center">
            <span className={taux >= 80 ? 'text-amber-500' : taux >= 50 ? 'text-blue-500' : 'text-indigo-500'}>{taux >= 80 ? <Trophy size={56} /> : taux >= 50 ? <TrendingUp size={56} /> : <TrendingUp size={56} />}</span>
          </motion.span>
          <h2 className="text-2xl font-bold text-gray-900">Révision terminée !</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-700">{total}</p>
              <p className="text-xs text-blue-500">Exercices</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-700">{ok}</p>
              <p className="text-xs text-green-500">Correctes</p>
            </div>
            <div className={`rounded-xl p-4 ${taux >= 50 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-2xl font-bold ${taux >= 50 ? 'text-green-700' : 'text-red-700'}`}>{taux}%</p>
              <p className={`text-xs ${taux >= 50 ? 'text-green-500' : 'text-red-500'}`}>Réussite</p>
            </div>
          </div>

          <div className="mt-6 text-left space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm ${r.est_correcte ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <span className={r.est_correcte ? 'text-emerald-500' : 'text-red-500'}>{r.est_correcte ? <CheckCircle2 size={18} /> : <XCircle size={18} />}</span>
                <p className="flex-1 text-gray-700 truncate">{r.question}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={() => { setMode('profil'); setFinished(false); window.location.reload(); }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Voir mon profil mis à jour
            </button>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // ════════════════════════════════════════
  // Mode QUIZ adaptatif en cours
  // ════════════════════════════════════════
  if (mode === 'quiz' && currentExo) {
    const choix = currentExo.choix || [];
    const progress = ((currentIndex + (submitted ? 1 : 0)) / exercices.length) * 100;

    return (
      <motion.div className="max-w-2xl mx-auto space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Brain size={20} className="text-orange-600" /> Révision Adaptative</h1>
            <span className="text-sm text-gray-500">
              {currentIndex + 1} / {exercices.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {/* Raison de la recommandation */}
          {currentRec?.raison && (
            <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-3 py-1 rounded-full inline-block">
              {currentRec.raison}
            </p>
          )}
        </div>

        {/* Question card */}
        <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-2 mb-4">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
              {currentExo.type_exercice}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
              currentExo.difficulte === 'facile' ? 'bg-green-100 text-green-700'
              : currentExo.difficulte === 'moyen' ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
            }`}>
              {currentExo.difficulte}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-5">{currentExo.question}</h2>

          <div className="space-y-3">
            {choix.map((c, i) => {
              let classes = 'w-full text-left p-4 rounded-xl border-2 transition text-sm font-medium ';
              if (!submitted) {
                classes += selected === i
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700';
              } else {
                if (c.correct) classes += 'border-green-500 bg-green-50 text-green-700';
                else if (selected === i && !c.correct) classes += 'border-red-500 bg-red-50 text-red-700';
                else classes += 'border-gray-200 text-gray-400';
              }

              return (
                <motion.button key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} onClick={() => handleSelect(i)} disabled={submitted} className={classes} whileHover={!submitted ? { scale: 1.02 } : {}} whileTap={!submitted ? { scale: 0.98 } : {}}>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0">
                      {submitted && c.correct ? '✓' : String.fromCharCode(65 + i)}
                    </span>
                    <span>{c.texte}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback IA */}
          {submitted && (
            <div className={`mt-5 p-4 rounded-xl ${
              choix[selected]?.correct
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-semibold text-sm ${
                choix[selected]?.correct ? 'text-green-700' : 'text-red-700'
              }`}>
                {choix[selected]?.correct ? 'Bonne réponse !' : 'Mauvaise réponse'}
              </p>
              {currentExo.explication && (
                <p className="text-sm text-gray-600 mt-2">{currentExo.explication}</p>
              )}
              {feedback && (
                <p className="text-sm text-orange-700 mt-2 bg-orange-50 rounded-lg p-2">
                  {feedback}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={selected === null}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Valider
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition"
              >
                {currentIndex + 1 >= exercices.length ? 'Résultats' : 'Suivant →'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ════════════════════════════════════════
  // Mode PROFIL (écran par défaut)
  // ════════════════════════════════════════
  return (
    <div className="px-1 sm:px-2 md:px-0">
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Brain size={24} className="text-orange-600" /> Révision Intelligente</h1>
          <p className="text-gray-500 mt-1">Analyse de ta maîtrise et exercices adaptés</p>
        </div>
        {exercices.length > 0 && (
          <button
            onClick={startQuiz}
            className="px-5 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition flex items-center gap-2"
          >
            Lancer la révision ({exercices.length} exercices)
          </button>
        )}
      </div>

      {/* Feedback IA global */}
      <div className={`rounded-2xl p-6 border ${
        fb.conseil === 'challenge' ? 'bg-green-50 border-green-200'
        : fb.conseil === 'reviser' ? 'bg-yellow-50 border-yellow-200'
        : fb.conseil === 'renforcer' ? 'bg-red-50 border-red-200'
        : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start gap-4">
          <span className="text-4xl">
            {fb.conseil === 'challenge' ? <Trophy size={40} className="text-emerald-600" /> : fb.conseil === 'reviser' ? <BookOpen size={40} className="text-yellow-600" /> : fb.conseil === 'renforcer' ? <TrendingUp size={40} className="text-red-500" /> : <GraduationCap size={40} className="text-blue-600" />}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Feedback personnalisé</h3>
            <p className="text-sm text-gray-700">{fb.message || "Commence par faire des exercices pour avoir un bilan !"}</p>
            {fb.taux_global !== undefined && (
              <div className="flex gap-4 mt-3 text-xs">
                <span className="bg-white/80 px-3 py-1 rounded-full font-medium">
                  Taux global : {fb.taux_global}%
                </span>
                <span className="bg-white/80 px-3 py-1 rounded-full font-medium">
                  {fb.total_tentatives} tentatives
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grille de maîtrise par notion */}
      {maitrise.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Maîtrise par notion</h2>
          <div className="space-y-3">
            {maitrise.map((n) => (
              <div key={n.notion_id} className="flex items-center gap-4">
                {/* Badge niveau */}
                <span className={`shrink-0 w-20 text-center text-xs font-bold py-1 rounded-full ${
                  n.niveau_maitrise === 'excellent' ? 'bg-green-100 text-green-700'
                  : n.niveau_maitrise === 'bon' ? 'bg-blue-100 text-blue-700'
                  : n.niveau_maitrise === 'moyen' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                  {n.niveau_maitrise}
                </span>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{n.notion_titre}</p>
                  <p className="text-xs text-gray-400">{n.lecon_titre}</p>
                </div>
                {/* Barre de progression */}
                <div className="w-32 shrink-0">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        n.taux_reussite >= 80 ? 'bg-green-500'
                        : n.taux_reussite >= 50 ? 'bg-yellow-500'
                        : 'bg-red-500'
                      }`}
                      style={{ width: `${n.taux_reussite}%` }}
                    />
                  </div>
                </div>
                {/* Taux */}
                <span className="text-sm font-bold text-gray-600 w-12 text-right">{n.taux_reussite}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercices recommandés */}
      {exercices.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Exercices recommandés</h2>
          <div className="space-y-2">
            {exercices.map((rec, i) => (
              <div key={rec.exercice.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{rec.exercice.question}</p>
                  <p className="text-xs text-orange-500 mt-0.5">{rec.raison}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  rec.exercice.difficulte === 'facile' ? 'bg-green-100 text-green-700'
                  : rec.exercice.difficulte === 'moyen' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
                }`}>
                  {rec.exercice.difficulte}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={startQuiz}
            className="mt-4 w-full py-3 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition"
          >
            Commencer la révision adaptative
          </button>
        </div>
      )}

      {/* Si aucun exercice dispo */}
      {exercices.length === 0 && maitrise.length === 0 && (
        <div className="text-center py-16">
          <span className="block mb-3 flex justify-center text-indigo-400"><Brain size={48} /></span>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Aucune donnée de révision</h2>
          <p className="text-gray-500 mb-4">
            Fais des quiz pour que le système analyse tes points faibles et te propose des révisions ciblées.
          </p>
          <Link to="/lecons" className="text-indigo-600 font-medium hover:underline">
            Voir les leçons
          </Link>
        </div>
      )}
      </motion.div>
    </div>
  );
}
