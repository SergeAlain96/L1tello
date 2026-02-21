import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, User, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch {
      setError('Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-classroom-dark flex items-center justify-center p-4">
      {/* ── Animated floating orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-500/15 rounded-full blur-2xl animate-float" />
      </div>

      {/* ── Subtle grid pattern ── */}
      <div className="absolute inset-0 opacity-[0.03] z-[1]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.7, type: 'spring', bounce: 0.4 }}
          className="text-center mb-10"
        >
          <motion.span
            className="inline-block text-indigo-400 drop-shadow-2xl"
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ delay: 0.8, duration: 1, ease: 'easeInOut' }}
          ><GraduationCap size={56} /></motion.span>
          <h1 className="text-4xl font-extrabold mt-4 gradient-text tracking-tight">L1tello</h1>
          <p className="text-indigo-300/60 mt-2 text-sm font-medium">Ton tuteur intelligent personnel</p>
        </motion.div>

        {/* ── Card ── */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="glass-dark rounded-3xl p-8 space-y-6 border border-white/[0.08] shadow-2xl shadow-indigo-500/10"
        >
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-white">Bon retour</h2>
            <p className="text-indigo-300/50 text-sm mt-1">Connecte-toi pour continuer</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 text-red-300 text-sm p-4 rounded-2xl border border-red-500/20 flex items-center gap-3"
            >
              <span className="text-red-400"><AlertTriangle size={18} /></span>
              <span>{error}</span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-indigo-200/80">Nom d'utilisateur</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/60 group-focus-within:text-indigo-400 transition-colors"><User size={18} /></span>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-white placeholder-indigo-300/30 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 focus:bg-white/[0.08] outline-none transition-all duration-300"
                placeholder="ton_pseudo"
                required
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-indigo-200/80">Mot de passe</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/60 group-focus-within:text-indigo-400 transition-colors"><Lock size={18} /></span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-white placeholder-indigo-300/30 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 focus:bg-white/[0.08] outline-none transition-all duration-300"
                placeholder="••••••••"
                required
              />
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(99,102,241,0.3)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connexion…</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2"><span>Se connecter</span> <ArrowRight size={18} /></span>
            )}
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="text-center text-sm text-indigo-300/50"
          >
            <span>Pas encore de compte ?</span>{' '}
            <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
              <span>S&apos;inscrire</span>
            </Link>
          </motion.p>
        </motion.form>

        {/* ── Bottom decorative line ── */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-8 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
        />
      </motion.div>
    </div>
  );
}
