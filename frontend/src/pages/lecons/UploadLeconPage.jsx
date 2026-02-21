import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../api/axios';
import { Upload, FileText, Paperclip, X, BookOpen, Library, CheckCircle2, AlertCircle, Lightbulb, Plus } from 'lucide-react';

const NIVEAUX = [
  { value: 'CP', label: 'CP' },
  { value: 'CE1', label: 'CE1' },
  { value: 'CE2', label: 'CE2' },
  { value: 'CM1', label: 'CM1' },
  { value: 'CM2', label: 'CM2' },
  { value: '6e', label: '6ème' },
  { value: '5e', label: '5ème' },
  { value: '4e', label: '4ème' },
  { value: '3e', label: '3ème' },
  { value: '2nde', label: 'Seconde' },
  { value: '1ere', label: 'Première' },
  { value: 'Tle', label: 'Terminale' },
];

export default function UploadLeconPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [matieres, setMatieres] = useState([]);
  const [titre, setTitre] = useState('');
  const [matiere, setMatiere] = useState('');
  const [nouvelleMatiere, setNouvelleMatiere] = useState('');
  const [niveau, setNiveau] = useState('6e');
  const [fichier, setFichier] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    API.get('/matieres/').then((res) => setMatieres(res.data));
  }, []);

  // ── Drag & Drop handlers ──
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      setFichier(file);
      setError('');
    } else {
      setError('Seuls les fichiers PDF sont acceptés.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Seuls les fichiers PDF sont acceptés.');
        return;
      }
      setFichier(file);
      setError('');
    }
  };

  const removeFichier = () => {
    setFichier(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!titre.trim()) return setError('Le titre est requis.');
    if (!matiere && !nouvelleMatiere.trim()) return setError('Sélectionnez une matière ou saisissez un nouveau nom.');
    if (!fichier) return setError('Ajoutez un fichier PDF.');

    const formData = new FormData();
    formData.append('titre', titre.trim());
    if (matiere === '__new__') {
      formData.append('nouvelle_matiere', nouvelleMatiere.trim());
    } else {
      formData.append('matiere', matiere);
    }
    formData.append('niveau', niveau);
    formData.append('fichier_pdf', fichier);

    setUploading(true);
    try {
      const res = await API.post('/upload-lecon/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.values(data).flat().join(' ');
        setError(msgs || "Erreur lors de l'upload.");
      } else {
        setError('Erreur réseau. Veuillez réessayer.');
      }
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  // ── Écran de succès ──
  if (result) {
    const lecon = result.lecon;
    return (
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }} className="block mb-4 flex justify-center text-emerald-500"><CheckCircle2 size={64} /></motion.span>
          <h2 className="text-2xl font-extrabold text-gray-900">Leçon créée !</h2>
          <p className="text-gray-500 mt-2">{result.message}</p>

          <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Titre</span>
              <span className="font-medium text-gray-800">{lecon.titre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Matière</span>
              <span className="font-medium text-gray-800">{lecon.matiere_nom}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Niveau</span>
              <span className="font-medium text-gray-800">{lecon.niveau}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Notions extraites</span>
              <span className="font-bold text-indigo-600">{result.notions_extraites}</span>
            </div>
          </div>

          {/* Liste des notions extraites */}
          {lecon.notions && lecon.notions.length > 0 && (
            <div className="mt-4 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><FileText size={14} /> Notions détectées :</p>
              <div className="space-y-1">
                {lecon.notions.map((n, i) => (
                  <div key={n.id} className="flex items-center gap-2 text-sm bg-indigo-50 rounded-lg px-3 py-2">
                    <span className="text-indigo-400 font-mono text-xs">{i + 1}.</span>
                    <span className="text-gray-700">{n.titre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={() => navigate('/lecons')}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Voir les leçons
            </button>
            <button
              onClick={() => navigate(`/lecons/${lecon.id}`)}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Ouvrir le lecteur
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Formulaire d'upload ──
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Upload size={28} className="text-indigo-600" /> Ajouter une leçon</h1>
        <p className="text-gray-500 mt-1">
          Uploadez un PDF — le texte sera extrait et découpé en notions automatiquement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la leçon
          </label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex : Les fractions — cours complet"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
        </div>

        {/* Matière + Niveau */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matière
            </label>
            <select
              value={matiere}
              onChange={(e) => { setMatiere(e.target.value); if (e.target.value !== '__new__') setNouvelleMatiere(''); }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
            >
              <option value="">Choisir…</option>
              {matieres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.icone} {m.nom}
                </option>
              ))}
              <option value="__new__">+ Nouvelle matière…</option>
            </select>
            {matiere === '__new__' && (
              <input
                type="text"
                value={nouvelleMatiere}
                onChange={(e) => setNouvelleMatiere(e.target.value)}
                placeholder="Ex : Philosophie, Économie…"
                className="w-full mt-2 px-4 py-2.5 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition bg-indigo-50"
                autoFocus
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau
            </label>
            <select
              value={niveau}
              onChange={(e) => setNiveau(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
            >
              {NIVEAUX.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone drag & drop / file picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fichier PDF
          </label>

          {!fichier ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
                ${dragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
            >
              <span className="block mb-2 flex justify-center text-gray-400"><FileText size={40} /></span>
              <p className="text-sm text-gray-600 font-medium">
                {dragActive ? 'Lâchez le fichier ici…' : 'Glissez-déposez un PDF ici'}
              </p>
              <p className="text-xs text-gray-400 mt-1">ou cliquez pour parcourir</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <span className="text-indigo-500"><Paperclip size={22} /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{fichier.name}</p>
                <p className="text-xs text-gray-500">{formatSize(fichier.size)}</p>
              </div>
              <button
                type="button"
                onClick={removeFichier}
                className="text-red-400 hover:text-red-600 transition"
                title="Retirer le fichier"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/lecons')}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Extraction en cours…
              </>
            ) : (
              'Uploader et analyser'
            )}
          </button>
        </div>
      </form>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1 flex items-center gap-1"><Lightbulb size={16} /> Comment ça marche ?</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-600">
          <li>Le texte du PDF est extrait automatiquement</li>
          <li>Le contenu est découpé en <strong>notions</strong> (chapitres, sections)</li>
          <li>Les notions sont sauvegardées et prêtes pour la révision</li>
          <li>Un tuteur (ou un admin) pourra ensuite créer des exercices</li>
        </ol>
      </div>
    </motion.div>
  );
}
