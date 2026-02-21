/**
 * Écran Upload de Leçon — sélection de fichier PDF et envoi au backend.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import API from '../../services/api';

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

export default function UploadLeconScreen({ navigation }) {
  const [matieres, setMatieres] = useState([]);
  const [titre, setTitre] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [nouvelleMatiere, setNouvelleMatiere] = useState('');
  const [showNewMatiere, setShowNewMatiere] = useState(false);
  const [niveau, setNiveau] = useState('6e');
  const [fichier, setFichier] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    API.get('/matieres/')
      .then((res) => setMatieres(res.data))
      .catch(() => {});
  }, []);

  // ── Sélection du fichier PDF ──
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        setFichier(file);
      }
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier.');
    }
  };

  // ── Formatage taille ──
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  // ── Upload ──
  const handleUpload = async () => {
    if (!titre.trim()) {
      return Alert.alert('Erreur', 'Le titre est requis.');
    }
    if (!selectedMatiere && !nouvelleMatiere.trim()) {
      return Alert.alert('Erreur', 'Sélectionnez une matière ou saisissez un nouveau nom.');
    }
    if (!fichier) {
      return Alert.alert('Erreur', 'Ajoutez un fichier PDF.');
    }

    const formData = new FormData();
    formData.append('titre', titre.trim());

    if (showNewMatiere && nouvelleMatiere.trim()) {
      formData.append('nouvelle_matiere', nouvelleMatiere.trim());
    } else if (selectedMatiere) {
      formData.append('matiere', selectedMatiere.id);
    }

    formData.append('niveau', niveau);
    formData.append('fichier_pdf', {
      uri: fichier.uri,
      name: fichier.name || 'lecon.pdf',
      type: fichier.mimeType || 'application/pdf',
    });

    setUploading(true);
    try {
      const res = await API.post('/upload-lecon/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s pour les gros PDF
      });

      Alert.alert(
        '🎉 Leçon créée !',
        `${res.data.message}`,
        [
          { text: 'Voir les leçons', onPress: () => navigation.navigate('Dashboard') },
          {
            text: 'Ouvrir la leçon',
            onPress: () => navigation.navigate('Lecon', { id: res.data.lecon.id }),
          },
        ],
      );
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.values(data).flat().join('\n');
        Alert.alert('Erreur', msgs || "Erreur lors de l'upload.");
      } else {
        Alert.alert('Erreur', 'Erreur réseau. Vérifiez votre connexion.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Titre ── */}
        <Text style={styles.label}>Titre de la leçon</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : Les fractions — cours complet"
          placeholderTextColor={COLORS.textMuted}
          value={titre}
          onChangeText={setTitre}
        />

        {/* ── Matière ── */}
        <Text style={styles.label}>Matière</Text>
        <View style={styles.chipRow}>
          {matieres.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.chip,
                selectedMatiere?.id === m.id && !showNewMatiere && styles.chipActive,
              ]}
              onPress={() => {
                setSelectedMatiere(m);
                setShowNewMatiere(false);
                setNouvelleMatiere('');
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedMatiere?.id === m.id && !showNewMatiere && styles.chipTextActive,
                ]}
              >
                {m.icone} {m.nom}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.chip, styles.chipNew, showNewMatiere && styles.chipActive]}
            onPress={() => {
              setShowNewMatiere(true);
              setSelectedMatiere(null);
            }}
          >
            <Text style={[styles.chipText, showNewMatiere && styles.chipTextActive]}>
              ➕ Nouvelle
            </Text>
          </TouchableOpacity>
        </View>

        {showNewMatiere && (
          <TextInput
            style={[styles.input, styles.inputNew]}
            placeholder="Nom de la nouvelle matière…"
            placeholderTextColor={COLORS.textMuted}
            value={nouvelleMatiere}
            onChangeText={setNouvelleMatiere}
            autoFocus
          />
        )}

        {/* ── Niveau ── */}
        <Text style={styles.label}>Niveau</Text>
        <View style={styles.chipRow}>
          {NIVEAUX.map((n) => (
            <TouchableOpacity
              key={n.value}
              style={[styles.chip, niveau === n.value && styles.chipActive]}
              onPress={() => setNiveau(n.value)}
            >
              <Text
                style={[styles.chipText, niveau === n.value && styles.chipTextActive]}
              >
                {n.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Fichier PDF ── */}
        <Text style={styles.label}>Fichier PDF</Text>
        {!fichier ? (
          <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
            <Text style={styles.filePickerEmoji}>📄</Text>
            <Text style={styles.filePickerText}>Appuyer pour choisir un PDF</Text>
            <Text style={styles.filePickerHint}>Depuis votre appareil</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileCard}>
            <Text style={styles.fileIcon}>📎</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>
                {fichier.name}
              </Text>
              <Text style={styles.fileSize}>{formatSize(fichier.size)}</Text>
            </View>
            <TouchableOpacity onPress={() => setFichier(null)}>
              <Text style={styles.fileRemove}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bouton Upload ── */}
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.buttonDisabled]}
          onPress={handleUpload}
          disabled={uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color={COLORS.textPrimary} size="small" />
              <Text style={styles.uploadButtonText}>Extraction en cours…</Text>
            </View>
          ) : (
            <Text style={styles.uploadButtonText}>📤 Uploader et analyser</Text>
          )}
        </TouchableOpacity>

        {/* ── Info ── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Comment ça marche ?</Text>
          <Text style={styles.infoText}>
            1. Le texte du PDF est extrait automatiquement{'\n'}
            2. Le contenu est découpé en notions{'\n'}
            3. Les notions sont prêtes pour la révision{'\n'}
            4. Des exercices pourront être générés par l'IA
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  inputNew: {
    marginTop: SPACING.sm,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipNew: {
    borderStyle: 'dashed',
  },
  chipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
  chipTextActive: {
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.semibold,
  },
  filePicker: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  filePickerEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  filePickerText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
  },
  filePickerHint: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.xs,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
  fileSize: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },
  fileRemove: {
    color: COLORS.error,
    fontSize: 18,
    paddingHorizontal: SPACING.sm,
  },
  uploadButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoCard: {
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.info,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  infoTitle: {
    color: COLORS.info,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    marginBottom: SPACING.sm,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 22,
  },
});
