import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeInput, isValidUsername, isValidEmail, containsXSS } from '../../utils/security';
import { GraduationCap, User, Mail, Lock, AlertTriangle, Library, School, ArrowRight } from 'lucide-react';

const NIVEAUX = [
  { value: 'CP', label: 'CP' }, { value: 'CE1', label: 'CE1' }, { value: 'CE2', label: 'CE2' },
  { value: 'CM1', label: 'CM1' }, { value: 'CM2', label: 'CM2' },
  { value: '6e', label: '6ème' }, { value: '5e', label: '5ème' }, { value: '4e', label: '4ème' }, { value: '3e', label: '3ème' },
  { value: '2nde', label: 'Seconde' }, { value: '1ere', label: 'Première' }, { value: 'Tle', label: 'Terminale' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '',
    role: 'eleve', niveau_scolaire: '6e',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: sanitizeInput(e.target.value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidUsername(form.username)) { setError("Le nom d'utilisateur doit contenir entre 3 et 50 caractères alphanumériques."); return; }
    if (form.email && !isValidEmail(form.email)) { setError("Adresse email invalide."); return; }
    if (form.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (containsXSS(form.username) || containsXSS(form.first_name) || containsXSS(form.last_name)) { setError("Les champs contiennent du contenu non autorisé."); return; }

    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data) { const msgs = Object.values(data).flat().join(' '); setError(msgs || "Erreur lors de l'inscription."); }
      else { setError('Erreur réseau. Veuillez réessayer.'); }
    } finally { setLoading(false); }
  };

  const fieldAnim = (i) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.15 + i * 0.06 } });
  const inputCls = "w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-white placeholder-indigo-300/30 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 focus:bg-white/[0.08] outline-none transition-all duration-300 text-sm";
  const labelCls = "block text-sm font-medium text-indigo-200/80 mb-1.5";

  return (
    <div className="min-h-screen relative overflow-hidden bg-classroom-dark flex items-center justify-center p-4">
      {/* ── Floating orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] bg-indigo-500/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/4 left-1/3 w-48 h-48 bg-violet-500/15 rounded-full blur-2xl animate-float" />
      </div>
      <div className="absolute inset-0 opacity-[0.03] z-[1]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        {/* ── Logo ── */}
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.7, type: 'spring', bounce: 0.4 }} className="text-center mb-8">
          <motion.span className="inline-block text-indigo-400 drop-shadow-2xl"
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ delay: 0.8, duration: 1, ease: 'easeInOut' }}><GraduationCap size={52} /></motion.span>
          <h1 className="text-4xl font-extrabold mt-3 gradient-text tracking-tight">L1tello</h1>
          <p className="text-indigo-300/60 mt-1 text-sm font-medium">Crée ton compte pour apprendre</p>
        </motion.div>

        {/* ── Form Card ── */}
        <motion.form onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="glass-dark rounded-3xl p-8 space-y-5 border border-white/[0.08] shadow-2xl shadow-indigo-500/10"
        >
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 text-red-300 text-sm p-4 rounded-2xl border border-red-500/20 flex items-center gap-3 overflow-hidden">
                <span className="text-red-400 shrink-0"><AlertTriangle size={18} /></span><span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prénom / Nom */}
          <motion.div {...fieldAnim(0)} className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Prénom</label>
              <input type="text" name="first_name" value={form.first_name} onChange={handleChange} className={inputCls} placeholder="Serge" required /></div>
            <div><label className={labelCls}>Nom</label>
              <input type="text" name="last_name" value={form.last_name} onChange={handleChange} className={inputCls} placeholder="KABORE" required /></div>
          </motion.div>

          <motion.div {...fieldAnim(1)}>
            <label className={labelCls}>Nom d'utilisateur</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/60 group-focus-within:text-indigo-400 transition-colors"><User size={18} /></span>
              <input type="text" name="username" value={form.username} onChange={handleChange}
                className={inputCls + " pl-12"} placeholder="Serge_Alain" required />
            </div>
          </motion.div>

          <motion.div {...fieldAnim(2)}>
            <label className={labelCls}>Email</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/60 group-focus-within:text-indigo-400 transition-colors"><Mail size={18} /></span>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className={inputCls + " pl-12"} placeholder="serge@email.com" required />
            </div>
          </motion.div>

          <motion.div {...fieldAnim(3)}>
            <label className={labelCls}>Mot de passe</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/60 group-focus-within:text-indigo-400 transition-colors"><Lock size={18} /></span>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                className={inputCls + " pl-12"} placeholder="Min. 6 caractères" minLength={6} required />
            </div>
          </motion.div>

          {/* Rôle */}
          <motion.div {...fieldAnim(4)}>
            <label className={labelCls}>Je suis</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ val: 'eleve', icon: <Library size={24} />, label: 'Élève' }, { val: 'tuteur', icon: <School size={24} />, label: 'Tuteur' }].map((r) => (
                <motion.button key={r.val} type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setForm({ ...form, role: r.val })}
                  className={`p-4 rounded-2xl border-2 text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    form.role === r.val
                      ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300 shadow-lg shadow-indigo-500/10'
                      : 'border-white/[0.08] bg-white/[0.03] text-indigo-300/50 hover:border-white/20'
                  }`}>
                  <span className="block mb-1 flex justify-center">{r.icon}</span><span>{r.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Niveau scolaire (élève only) */}
          <AnimatePresence>
            {form.role === 'eleve' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <label className={labelCls}>Niveau scolaire</label>
                <select name="niveau_scolaire" value={form.niveau_scolaire} onChange={handleChange}
                  className={inputCls + " appearance-none cursor-pointer"}>
                  {NIVEAUX.map((n) => <option key={n.value} value={n.value} className="bg-slate-900 text-white">{n.label}</option>)}
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(99,102,241,0.3)' }}
            whileTap={{ scale: 0.98 }}
            {...fieldAnim(5)}
            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 shadow-lg shadow-indigo-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Inscription…</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2"><span>Créer mon compte</span> <ArrowRight size={18} /></span>
            )}
          </motion.button>

          <motion.p {...fieldAnim(6)} className="text-center text-sm text-indigo-300/50">
            <span>Déjà un compte ?</span>{' '}
            <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"><span>Se connecter</span></Link>
          </motion.p>
        </motion.form>

        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 1 }}
          className="mt-8 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </motion.div>
    </div>
  );
}
