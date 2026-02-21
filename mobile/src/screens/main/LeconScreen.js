/**
 * Écran Leçon — affiche le détail d'une leçon, ses notions et un chatbot IA.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import API from '../../services/api';
import AIChatBot from '../../components/AIChatBot';
import { cacheLeconDetail, getCachedLeconDetail } from '../../services/offlineService';

export default function LeconScreen({ route, navigation }) {
  const { id } = route.params;
  const [lecon, setLecon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);

  useEffect(() => {
    const fetchLecon = async () => {
      try {
        const { data } = await API.get(`/lecons/${id}/`);
        setLecon(data);
        // Mettre en cache pour le mode hors ligne
        cacheLeconDetail(id, data);
      } catch (err) {
        console.warn('Erreur chargement leçon:', err.message);
        // Fallback hors ligne
        const cached = await getCachedLeconDetail(id);
        if (cached) setLecon(cached);
      } finally {
        setLoading(false);
      }
    };
    fetchLecon();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!lecon) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Leçon introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── En-tête ── */}
      <Text style={styles.title}>{lecon.titre}</Text>
      <Text style={styles.meta}>
        {lecon.matiere_nom} · {lecon.niveau}
      </Text>

      {/* ── Boutons Quiz + IA ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.quizButton}
          onPress={() => navigation.navigate('Quiz', { leconId: lecon.id })}
          activeOpacity={0.8}
        >
          <Text style={styles.quizButtonText}>🧠 Passer le Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setChatVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.chatButtonText}>🤖 Tuteur IA</Text>
        </TouchableOpacity>
      </View>

      {/* ── Notions ── */}
      <Text style={styles.sectionTitle}>
        📖 Notions ({lecon.notions?.length ?? 0})
      </Text>

      {(lecon.notions || []).map((notion, index) => (
        <View key={notion.id} style={styles.notionCard}>
          <Text style={styles.notionOrder}>Notion {index + 1}</Text>
          <Text style={styles.notionTitle}>{notion.titre}</Text>
          <Text style={styles.notionContent} numberOfLines={6}>
            {notion.contenu}
          </Text>
        </View>
      ))}

      {/* ── Chatbot IA ── */}
      <AIChatBot
        leconId={lecon.id}
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
      />

      {/* ── Bouton flottant chat ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setChatVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>🤖</Text>
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
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.md,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  meta: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  quizButton: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  quizButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  chatButton: {
    flex: 1,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  chatButtonText: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  notionCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notionOrder: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.accent,
    fontWeight: FONTS.weights.semibold,
    marginBottom: SPACING.xs,
  },
  notionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  notionContent: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
