import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import { Bot, Sparkles, AlertCircle } from 'lucide-react';

/**
 * QuizGenerator — Bouton magique pour générer un quiz IA
 * à partir du texte d'une leçon.
 *
 * Props:
 *   - leconId: ID de la leçon
 *   - onQuizGenerated: callback(exercices) appelé quand le quiz est prêt
 */
export default function QuizGenerator({ leconId, onQuizGenerated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nbQuestions, setNbQuestions] = useState(5);

  const handleGenerate = async () => {
    if (!leconId) return;
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/ia/generer-quiz/', {
        lecon_id: leconId,
        nb_questions: nbQuestions,
      });

      if (onQuizGenerated) {
        onQuizGenerated(res.data.exercices || []);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur lors de la génération du quiz.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-purple-600"><Bot size={24} /></span>
        <div>
          <h3 className="font-semibold text-purple-800 text-sm">Générer un quiz avec l'IA</h3>
          <p className="text-xs text-purple-500">L'IA crée des QCM basés sur le contenu de la leçon</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Sélecteur nombre de questions */}
        <select
          value={nbQuestions}
          onChange={(e) => setNbQuestions(parseInt(e.target.value))}
          disabled={loading}
          className="px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-400 outline-none"
        >
          <option value={3}>3 questions</option>
          <option value={5}>5 questions</option>
          <option value={8}>8 questions</option>
          <option value={10}>10 questions</option>
        </select>

        {/* Bouton magique */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Génération en cours…</span>
            </>
          ) : (
            <span className="flex items-center gap-1"><Sparkles size={16} /> Générer le Quiz</span>
          )}
        </motion.button>
      </div>

      {/* Indicateur de chargement détaillé */}
      {loading && (
        <div className="mt-3 bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="animate-pulse flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-xs text-purple-600">
              L'IA analyse le texte et crée {nbQuestions} questions adaptées…
            </p>
          </div>
        </div>
      )}

      {/* Erreur */}
      <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-3 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
