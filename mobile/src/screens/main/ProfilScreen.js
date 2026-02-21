/**
 * Écran Profil — affiche et édite le profil de l'utilisateur.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfilScreen() {
  const { user, logout } = useAuth();

  const infoRows = [
    { label: "Nom d'utilisateur", value: user?.username },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Prénom', value: user?.first_name || '—' },
    { label: 'Nom', value: user?.last_name || '—' },
    { label: 'Rôle', value: user?.role === 'eleve' ? '🎒 Élève' : '👨‍🏫 Tuteur' },
    { label: 'Niveau scolaire', value: user?.niveau_scolaire || '—' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Avatar ── */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>
            {user?.role === 'tuteur' ? '👨‍🏫' : '🎒'}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.first_name || user?.username}
        </Text>
      </View>

      {/* ── Informations ── */}
      <View style={styles.card}>
        {infoRows.map((row, i) => (
          <View
            key={row.label}
            style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}
          >
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* ── Déconnexion ── */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
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
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  name: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.medium,
  },
  logoutButton: {
    marginTop: SPACING.xl,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
});
