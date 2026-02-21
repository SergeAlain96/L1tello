import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import { Bot, Send, Lightbulb, Loader2, CircleDot } from 'lucide-react';

/**
 * AIChatBot — Side-panel de chat IA contextuel (style NotebookLM).
 * Utilise le RAG pour répondre en se basant sur le texte de la leçon.
 *
 * Props:
 *   - leconId: ID de la leçon pour le contexte RAG
 *   - leconTitre: Titre affiché dans le header
 *   - notionActive: Notion actuellement sélectionnée (optionnel)
 */
export default function AIChatBot({ leconId, leconTitre, notionActive }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Salut ! Je suis ton tuteur IA pour la leçon « ${leconTitre || 'cette leçon'} ». Pose-moi tes questions et je t'expliquerai tout en me basant sur le contenu du cours !`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Quand la notion change, proposer de l'aide
  useEffect(() => {
    if (notionActive) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Tu regardes la notion « ${notionActive.titre} ». N'hésite pas à me poser des questions dessus !`,
        },
      ]);
    }
  }, [notionActive?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      // Construire l'historique pour le contexte
      const historique = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await API.post('/ia/chatbot/', {
        lecon_id: leconId,
        question: question,
        historique: historique,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.reponse },
      ]);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        "Désolé, je n'ai pas pu répondre. Réessaie !";
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Suggestions rapides
  const suggestions = [
    "Explique-moi cette notion simplement",
    "Donne-moi un exemple concret",
    "Résume le point important",
    "Qu'est-ce que je dois retenir ?",
  ];

  const handleSuggestion = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <span className="text-indigo-600"><Bot size={22} /></span>
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Tuteur IA</h2>
            <p className="text-xs text-gray-400">
              {loading ? <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> En train de réfléchir…</span> : <span className="flex items-center gap-1"><CircleDot size={12} className="text-emerald-500" /> Prêt à t'aider</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
            </div>
          </motion.div>
        ))}

        {/* Indicateur de frappe */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions rapides (si peu de messages) */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><Lightbulb size={12} /> Suggestions :</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleSuggestion(s)}
                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{s}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 p-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pose ta question au tuteur IA…"
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
