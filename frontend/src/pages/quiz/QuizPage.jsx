import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { cacheExercices, cacheLeconDetail, addPendingAction, isOnline } from '../../services/offlineCache';
import { motion, AnimatePresence } from 'framer-motion';
import { Puzzle, Trophy, ThumbsUp, TrendingUp, CheckCircle2, XCircle, BarChart3, BookOpen, Lightbulb, Flag } from 'lucide-react';

const fadeUp = (d = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { delay: d, duration: 0.5 } },
});

export default function QuizPage() {

  // Gestion du chargement
  const [loading, setLoading] = useState(true);
  const [exercices, setExercices] = useState([]);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [leconId, setLeconId] = useState(null);
  const [leconTitre, setLeconTitre] = useState("");

  useEffect(() => {
    // Exemple de chargement asynchrone, à adapter selon la logique réelle
    async function fetchData() {
      setLoading(true);
      // ... ici, charger les exercices, leçon, etc ...
      // await ...
      setLoading(false);
    }
    fetchData();
  }, []);

  // Ajout du wrapper responsive
  return (
    <div className="px-1 sm:px-2 md:px-0">
      {/* Contenu principal QuizPage */}
      {/* ...existing code... */}
      {(() => {
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
        if (exercices.length === 0) {
          return (
            <motion.div className="text-center py-16" {...fadeUp()}>
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="block mb-3 flex justify-center text-indigo-400"><Puzzle size={48} /></motion.span>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Aucun exercice disponible</h2>
              <p className="text-gray-500 mb-4">
                {leconId
                  ? 'Cette leçon ne contient pas encore d\'exercices.'
                  : 'Aucun exercice n\'a été créé pour le moment.'}
              </p>
              <Link
                to="/lecons"
                className="text-indigo-600 font-medium hover:underline"
              >
                ← Voir les leçons
              </Link>
            </motion.div>
          );
        }
        if (finished) {
          const total = results.length;
          const correctes = results.filter((r) => r.est_correcte).length;
          const taux = total > 0 ? Math.round((correctes / total) * 100) : 0;
          return (
            <motion.div className="max-w-2xl mx-auto space-y-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }} className="block mb-4 flex justify-center">
                  <span className={taux >= 80 ? 'text-amber-500' : taux >= 50 ? 'text-blue-500' : 'text-indigo-500'}>{taux >= 80 ? <Trophy size={56} /> : taux >= 50 ? <ThumbsUp size={56} /> : <TrendingUp size={56} />}</span>
                </motion.span>
                <h2 className="text-2xl font-bold text-gray-900">Quiz terminé !</h2>
                {leconTitre && (
                  <p className="text-gray-500 mt-1">Leçon : {leconTitre}</p>
                )}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-blue-700">{total}</p>
                    <p className="text-xs text-blue-500">Questions</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-green-700">{correctes}</p>
                    <p className="text-xs text-green-500">Correctes</p>
                  </div>
                  <div className={`rounded-xl p-4 ${taux >= 50 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-2xl font-bold ${taux >= 50 ? 'text-green-700' : 'text-red-700'}`}>
                      {taux}%
                    </p>
                    <p className={`text-xs ${taux >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                      Réussite
                    </p>
                  </div>
                </div>
                {/* Détail des réponses */}
                <div className="mt-6 text-left space-y-2">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                        r.est_correcte ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <span className={r.est_correcte ? 'text-emerald-500' : 'text-red-500'}>{r.est_correcte ? <CheckCircle2 size={18} /> : <XCircle size={18} />}</span>
                      <p className="flex-1 text-gray-700 truncate">{r.question}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6 justify-center">
                  <Link
                    to="/dashboard"
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Dashboard
                  </Link>
                  {leconId && (
                    <Link
                      to={`/lecons/${leconId}`}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                      Revoir la leçon
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );
        }
        // ── Question en cours ──
        const choix = current.choix || [];
        return (
          <motion.div className="max-w-2xl mx-auto space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Puzzle size={20} className="text-indigo-600" /> Quiz</h1>
                <span className="text-sm text-gray-500">
                  Question {currentIndex + 1} / {exercices.length}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {leconTitre && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><BookOpen size={12} /> {leconTitre}</p>
              )}
            </div>
            {/* Question Card */}
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              {/* Badges */}
              <div className="flex gap-2 mb-4">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                  {current.type_exercice}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  current.difficulte === 'facile'
                    ? 'bg-green-100 text-green-700'
                    : current.difficulte === 'moyen'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {current.difficulte}
                </span>
              </div>
              {/* Question */}
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                {current.question}
              </h2>
              {/* Choix */}
              <div className="space-y-3">
                {choix.map((c, i) => {
                  let classes = 'w-full text-left p-4 rounded-xl border-2 transition text-sm font-medium ';
                  if (!submitted) {
                    classes += selected === i
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700';
                  } else {
                    if (c.correct) {
                      classes += 'border-green-500 bg-green-50 text-green-700';
                    } else if (selected === i && !c.correct) {
                      classes += 'border-red-500 bg-red-50 text-red-700';
                    } else {
                      classes += 'border-gray-200 text-gray-400';
                    }
                  }
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleSelect(i)}
                      disabled={submitted}
                      className={classes}
                      whileHover={!submitted ? { scale: 1.02 } : {}}
                      whileTap={!submitted ? { scale: 0.98 } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0
                          ${submitted && c.correct ? 'border-green-500 bg-green-500 text-white' : ''}
                        ">
                          {submitted && c.correct ? '✓' : String.fromCharCode(65 + i)}
                        </span>
                        <span>{c.texte}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              {/* Feedback après soumission */}
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
                  {current.explication && (
                    <p className="text-sm text-gray-600 mt-2">
                      {current.explication}
                    </p>
                  )}
                </div>
              )}
              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={selected === null}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ Valider
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                  >
                    {currentIndex + 1 >= exercices.length ? 'Voir les résultats' : 'Suivant →'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </div>
  );
}
