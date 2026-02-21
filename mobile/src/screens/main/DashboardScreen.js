/**
 * Écran Dashboard — vue principale après connexion.
 * Affiche les statistiques de progression et les leçons disponibles.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../services/api';
import { cacheLecons, getCachedLecons, syncPendingPerformances } from '../../services/offlineService';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      // Sync des performances hors ligne au retour
      syncPendingPerformances(API).then((n) => {
        if (n > 0) console.log(`${n} performance(s) synchronisée(s)`);
      }).catch(() => {});

      const { data: res } = await API.get('/dashboard/');
      setData(res);

      // Mettre en cache les leçons pour le mode hors ligne
      if (res?.lecons_disponibles) {
        cacheLecons(res.lecons_disponibles);
      }
    } catch (err) {
      console.warn('Erreur dashboard:', err.message);
      // Fallback hors ligne : charger les leçons du cache
      const cached = await getCachedLecons();
      if (cached) {
        setData({ lecons_disponibles: cached, stats: {}, role: user?.role });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  const stats = data?.stats || {};
  const isEleve = data?.role === 'eleve';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* ── En-tête utilisateur ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Bonjour {user?.first_name || user?.username} 👋
          </Text>
          <Text style={styles.role}>
            {isEleve ? '🎒 Élève' : '👨‍🏫 Tuteur'}
            {user?.niveau_scolaire ? ` · ${user.niveau_scolaire}` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* ── Actions rapides ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('UploadLecon')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionEmoji}>📤</Text>
          <Text style={styles.actionLabel}>Ajouter un PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Profil')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionEmoji}>👤</Text>
          <Text style={styles.actionLabel}>Mon profil</Text>
        </TouchableOpacity>
      </View>

      {/* ── Statistiques ── */}
      <Text style={styles.sectionTitle}>📊 Statistiques</Text>
      <View style={styles.statsGrid}>
        {isEleve ? (
          <>
            <StatCard
              label="Exercices tentés"
              value={stats.exercices_tentes ?? 0}
              color={COLORS.info}
            />
            <StatCard
              label="Réussis"
              value={stats.exercices_reussis ?? 0}
              color={COLORS.success}
            />
            <StatCard
              label="Taux réussite"
              value={`${stats.taux_reussite ?? 0}%`}
              color={COLORS.accent}
            />
            <StatCard
              label="Score moyen"
              value={stats.score_moyen ?? 0}
              color={COLORS.secondary}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Leçons créées"
              value={stats.lecons_creees ?? 0}
              color={COLORS.info}
            />
            <StatCard
              label="Élèves suivis"
              value={stats.total_eleves ?? 0}
              color={COLORS.success}
            />
            <StatCard
              label="Tentatives"
              value={stats.total_tentatives ?? 0}
              color={COLORS.accent}
            />
            <StatCard
              label="Taux réussite"
              value={`${stats.taux_reussite_global ?? 0}%`}
              color={COLORS.secondary}
            />
          </>
        )}
      </View>

      {/* ── Leçons disponibles ── */}
      <Text style={styles.sectionTitle}>📚 Leçons disponibles</Text>
      {(data?.lecons_disponibles || []).length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune leçon pour le moment.</Text>
        </View>
      ) : (
        data.lecons_disponibles.map((lecon) => (
          <TouchableOpacity
            key={lecon.id}
            style={styles.leconCard}
            onPress={() => navigation.navigate('Lecon', { id: lecon.id })}
            activeOpacity={0.7}
          >
            <Text style={styles.leconTitle}>{lecon.titre}</Text>
            <Text style={styles.leconMeta}>
              {lecon.matiere_nom} · {lecon.niveau} · {lecon.nb_notions ?? 0} notion(s)
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// ── Composant carte statistique ──
function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  role: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  logoutBtn: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  actionLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    width: '48%',
    flexGrow: 1,
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.extrabold,
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  leconCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  leconTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
  },
  leconMeta: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  emptyCard: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
});
