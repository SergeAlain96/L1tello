/**
 * Écran d'inscription — RegisterScreen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

const NIVEAUX = [
  'CP', 'CE1', 'CE2', 'CM1', 'CM2',
  '6e', '5e', '4e', '3e',
  '2nde', '1ere', 'Tle',
];

const ROLES = [
  { value: 'eleve', label: '🎒 Élève' },
  { value: 'tuteur', label: '👨‍🏫 Tuteur' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'eleve',
    niveau_scolaire: '6e',
  });
  const [loading, setLoading] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      Alert.alert('Erreur', "Le nom d'utilisateur et le mot de passe sont requis.");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.values(data).flat().join('\n');
        Alert.alert('Erreur', msgs || "Erreur lors de l'inscription.");
      } else {
        Alert.alert('Erreur', 'Erreur réseau. Vérifiez votre connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Logo ── */}
        <Text style={styles.emoji}>🎓</Text>
        <Text style={styles.title}>L1tello</Text>
        <Text style={styles.subtitle}>Crée ton compte pour apprendre</Text>

        {/* ── Formulaire ── */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur *"
            placeholderTextColor={COLORS.textMuted}
            value={form.username}
            onChangeText={(v) => updateField('username', v)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe * (min. 6 caractères)"
            placeholderTextColor={COLORS.textMuted}
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            secureTextEntry
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Prénom"
              placeholderTextColor={COLORS.textMuted}
              value={form.first_name}
              onChangeText={(v) => updateField('first_name', v)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Nom"
              placeholderTextColor={COLORS.textMuted}
              value={form.last_name}
              onChangeText={(v) => updateField('last_name', v)}
            />
          </View>

          {/* ── Sélection du rôle ── */}
          <Text style={styles.label}>Rôle</Text>
          <View style={styles.chipRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.chip,
                  form.role === r.value && styles.chipActive,
                ]}
                onPress={() => updateField('role', r.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    form.role === r.value && styles.chipTextActive,
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Sélection du niveau ── */}
          {form.role === 'eleve' && (
            <>
              <Text style={styles.label}>Niveau scolaire</Text>
              <View style={styles.chipRow}>
                {NIVEAUX.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.chip,
                      form.niveau_scolaire === n && styles.chipActive,
                    ]}
                    onPress={() => updateField('niveau_scolaire', n)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.niveau_scolaire === n && styles.chipTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── Bouton ── */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={styles.buttonText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Lien connexion ── */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>
            Déjà un compte ?{' '}
            <Text style={styles.linkBold}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.extrabold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  form: {
    width: '100%',
    gap: SPACING.sm,
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
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
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
  button: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  linkContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
});
