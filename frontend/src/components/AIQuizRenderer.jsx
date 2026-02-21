import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import API from '../api/axios';
import { Trophy, ThumbsUp, TrendingUp, CheckCircle2, XCircle, Bot, Lightbulb, ArrowRight } from 'lucide-react';

/**
 * AIQuizRenderer — Affiche un quiz généré par l'IA sous forme interactive.
 * Prend un tableau d'exercices JSON et les affiche comme formulaire QCM.
 *
 * Props:
 *   - exercices: tableau d'exercices au format API
 *   - leconTitre: titre de la leçon (optionnel)
 *   - onFinish: callback quand le quiz est terminé
 */
export default function AIQuizRenderer({ exercices = [], leconTitre = '', onFinish }) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  if (!exercices.length) {
    return null;
  }

  const current = exercices[currentIndex];
  const choix = current?.choix || [];
  const progress = ((currentIndex + (submitted ? 1 : 0)) / exercices.length) * 100;

  const handleSelect = (index) => {
    if (submitted) return;
    setSelected(index);
  };

  const handleSubmit = async () => {
    if (selected === null || submitted) return;

    const isCorrect = choix[selected]?.correct === true;
    const elapsedMs = Date.now() - startTime;

    setSubmitted(true);
    setResults((prev) => [
      ...prev,
      {
        question: current.question,
        est_correcte: isCorrect,
        score: isCorrect ? 100 : 0,
      },
    ]);

    // Enregistrer la performance
    try {
      await API.post('/performances/', {
        eleve: user.id,
        exercice: current.id,
        reponse_donnee: { index: selected, texte: choix[selected]?.texte },
        est_correcte: isCorrect,
        score: isCorrect ? 100 : 0,
        temps_reponse: `${Math.floor(elapsedMs / 1000)}`,
      });
    } catch {
      // silencieux
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= exercices.length) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelected(null);
      setSubmitted(false);
      setStartTime(Date.now());
    }
  };

  // ── Écran de fin ──
  if (finished) {
    const total = results.length;
    const ok = results.filter((r) => r.est_correcte).length;
    const taux = total > 0 ? Math.round((ok / total) * 100) : 0;

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', duration: 0.6 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }} className="block mb-4 flex justify-center">
          <span className={taux >= 80 ? 'text-amber-500' : taux >= 50 ? 'text-blue-500' : 'text-indigo-500'}>{taux >= 80 ? <Trophy size={56} /> : taux >= 50 ? <ThumbsUp size={56} /> : <TrendingUp size={56} />}</span>
        </motion.span>
        <h2 className="text-2xl font-bold text-gray-900">Quiz IA terminé !</h2>
        {leconTitre && <p className="text-gray-500 mt-1">{leconTitre}</p>}

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-700">{total}</p>
            <p className="text-xs text-blue-500">Questions</p>
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

        {/* Détail */}
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

        <button
          onClick={() => onFinish?.()}
          className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Fermer
        </button>
      </motion.div>
    );
  }

  // ── Question en cours ──
  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-purple-700 flex items-center gap-1"><Bot size={14} /> Quiz IA</h3>
          <span className="text-xs text-gray-500">
            {currentIndex + 1} / {exercices.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-xl border border-gray-200 p-5">
        {/* Badges */}
        <div className="flex gap-2 mb-3">
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">IA</span>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
            current.difficulte === 'facile' ? 'bg-green-100 text-green-700'
            : current.difficulte === 'moyen' ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
          }`}>
            {current.difficulte}
          </span>
        </div>

        <h2 className="text-base font-semibold text-gray-900 mb-4">{current.question}</h2>

        {/* Choix */}
        <div className="space-y-2">
          {choix.map((c, i) => {
            let classes = 'w-full text-left p-3 rounded-lg border-2 transition text-sm ';
            if (!submitted) {
              classes += selected === i
                ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700';
            } else {
              if (c.correct) classes += 'border-green-500 bg-green-50 text-green-700 font-medium';
              else if (selected === i) classes += 'border-red-500 bg-red-50 text-red-700';
              else classes += 'border-gray-200 text-gray-400';
            }

            return (
              <motion.button key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} onClick={() => handleSelect(i)} disabled={submitted} className={classes} whileHover={!submitted ? { scale: 1.02 } : {}} whileTap={!submitted ? { scale: 0.98 } : {}}>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0">
                    {submitted && c.correct ? '✓' : String.fromCharCode(65 + i)}
                  </span>
                  <span>{c.texte}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        {submitted && (
          <div className={`mt-4 p-3 rounded-lg ${
            choix[selected]?.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`font-semibold text-sm ${choix[selected]?.correct ? 'text-green-700' : 'text-red-700'}`}>
              {choix[selected]?.correct ? 'Bonne réponse !' : 'Mauvaise réponse'}
            </p>
            {current.explication && (
              <p className="text-sm text-gray-600 mt-1">{current.explication}</p>
            )}
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 mt-4">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
            >
              Valider
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              {currentIndex + 1 >= exercices.length ? 'Voir les résultats' : 'Question suivante'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
