import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import AIChatBot from '../../components/AIChatBot';
import QuizGenerator from '../../components/QuizGenerator';
import AIQuizRenderer from '../../components/AIQuizRenderer';
import { Frown, Puzzle, FileText, BookOpen } from 'lucide-react';

export default function LecteurPage() {
  const { id } = useParams();
  const [lecon, setLecon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notionActive, setNotionActive] = useState(null);
  const [aiQuizExercices, setAiQuizExercices] = useState(null); // Quiz IA généré
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    API.get(`/lecons/${id}/`)
      .then((res) => {
        setLecon(res.data);
        if (res.data.notions?.length > 0) {
          setNotionActive(res.data.notions[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleQuizGenerated = (exercices) => {
    setAiQuizExercices(exercices);
    setShowQuiz(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative"><div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} /></div>
      </div>
    );
  }

  if (!lecon) {
    return (
      <div className="text-center py-16 text-gray-400">
        <span className="block mb-3 flex justify-center"><Frown size={48} /></span>
        <p>Leçon introuvable</p>
        <Link to="/lecons" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
          ← Retour aux leçons
        </Link>
      </div>
    );
  }

  const notions = lecon.notions || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Link to="/lecons" className="text-gray-400 hover:text-gray-600 transition">
          ← Retour
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{lecon.titre}</h1>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
              {lecon.matiere_nom}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {lecon.niveau}
            </span>
          </div>
        </div>
        {lecon.exercices?.length > 0 || notions.length > 0 ? (
          <Link
            to={`/quiz?lecon=${lecon.id}`}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-1"
          >
            <Puzzle size={16} /> Passer le Quiz
          </Link>
        ) : null}
      </motion.div>

      {/* ── Quiz IA généré (plein écran) ── */}
      {showQuiz && aiQuizExercices && (
        <div className="max-w-2xl mx-auto">
          <AIQuizRenderer
            exercices={aiQuizExercices}
            leconTitre={lecon.titre}
            onFinish={() => { setShowQuiz(false); setAiQuizExercices(null); }}
          />
        </div>
      )}

      {/* ── Layout 3 colonnes : Notions + PDF + Chat IA ── */}
      {!showQuiz && (
        <>
          {/* Bouton Magique — Générer Quiz IA */}
          <QuizGenerator leconId={lecon.id} onQuizGenerated={handleQuizGenerated} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-16rem)]">
        {/* Colonne gauche : Contenu de la leçon / notions */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Tabs : Notions */}
          <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <FileText size={14} /> Notions ({notions.length})
            </h2>
          </div>

          {/* Liste des notions */}
          <div className="flex-1 overflow-y-auto">
            {notions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">Aucune notion extraite pour cette leçon</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notions.map((notion) => (
                  <button
                    key={notion.id}
                    onClick={() => setNotionActive(notion)}
                    className={`w-full text-left p-4 transition hover:bg-gray-50 ${
                      notionActive?.id === notion.id
                        ? 'bg-indigo-50 border-l-4 border-indigo-500'
                        : ''
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-800">{notion.titre}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {notion.contenu}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Détail de la notion active */}
          {notionActive && (
            <div className="border-t border-gray-200 p-4 bg-indigo-50/50 max-h-64 overflow-y-auto">
              <h3 className="font-semibold text-indigo-700 text-sm mb-2 flex items-center gap-1">
                <BookOpen size={14} /> {notionActive.titre}
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {notionActive.contenu}
              </p>
            </div>
          )}
        </div>

        {/* Colonne droite : Chat IA (RAG) */}
        <div className="lg:col-span-2">
          <AIChatBot
            leconId={lecon.id}
            leconTitre={lecon.titre}
            notionActive={notionActive}
          />
        </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
