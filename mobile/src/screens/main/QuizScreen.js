/**
 * Écran Quiz — charge et affiche les exercices d'une leçon.
 * Placeholder pour le moteur de quiz complet (Phase 3).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import API from '../../services/api';
import { cacheExercices, getCachedExercices, queuePerformance } from '../../services/offlineService';

export default function QuizScreen({ route, navigation }) {
  const { leconId } = route.params;
  const [exercices, setExercices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongNotions, setWrongNotions] = useState([]);

  useEffect(() => {
    const fetchExercices = async () => {
      try {
        const { data } = await API.get(`/exercices/?lecon=${leconId}`);
        setExercices(data);
        // Mettre en cache pour le mode hors ligne
        cacheExercices(leconId, data);
      } catch (err) {
        console.warn('Erreur chargement exercices:', err.message);
        // Fallback hors ligne
        const cached = await getCachedExercices(leconId);
        if (cached) setExercices(cached);
      } finally {
        setLoading(false);
      }
    };
    fetchExercices();
  }, [leconId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (exercices.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>📝</Text>
        <Text style={styles.emptyText}>Aucun exercice pour cette leçon.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Quiz terminé
  if (currentIndex >= exercices.length) {
    const total = exercices.length;
    const pct = Math.round((score / total) * 100);
    return (
      <View style={styles.centered}>
        <Text style={styles.resultEmoji}>
          {pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📖'}
        </Text>
        <Text style={styles.resultTitle}>Quiz terminé !</Text>
        <Text style={styles.resultScore}>
          {score}/{total} ({pct}%)
        </Text>

        {/* ── Notions à réviser ── */}
        {wrongNotions.length > 0 && (
          <View style={styles.revisionCard}>
            <Text style={styles.revisionTitle}>📌 Notions à réviser</Text>
            {wrongNotions.map((n) => (
              <Text key={n.id} style={styles.revisionItem}>• {n.titre}</Text>
            ))}
          </View>
        )}

        <View style={styles.resultActions}>
          {wrongNotions.length > 0 && (
            <TouchableOpacity
              style={styles.revisionButton}
              onPress={() => navigation.replace('Lecon', { id: leconId })}
            >
              <Text style={styles.revisionButtonText}>📖 Réviser la leçon</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const exercice = exercices[currentIndex];
  const choix = exercice.choix || [];

  const handleSelect = (index) => {
    if (answered) return;
    setSelectedChoice(index);
  };

  const handleValidate = async () => {
    if (selectedChoice === null) return;
    setAnswered(true);

    const isCorrect = choix[selectedChoice]?.correct === true;
    if (isCorrect) {
      setScore((s) => s + 1);
    } else if (exercice.notion_titre) {
      setWrongNotions((prev) => {
        if (!prev.find((n) => n.id === exercice.notion)) {
          return [...prev, { id: exercice.notion, titre: exercice.notion_titre }];
        }
        return prev;
      });
    }

    // Enregistrer la performance (ou mettre en file d'attente hors ligne)
    const perfData = {
      exercice: exercice.id,
      reponse_donnee: { index: selectedChoice, texte: choix[selectedChoice]?.texte },
      est_correcte: isCorrect,
      score: isCorrect ? 100 : 0,
      temps_reponse: '15',
    };

    try {
      await API.post('/performances/', perfData);
    } catch {
      // Hors ligne : mettre en file d'attente pour sync ultérieure
      await queuePerformance(perfData);
    }
  };

  const handleNext = () => {
    setCurrentIndex((i) => i + 1);
    setSelectedChoice(null);
    setAnswered(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Progression ── */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex + 1) / exercices.length) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        Question {currentIndex + 1}/{exercices.length}
      </Text>

      {/* ── Question ── */}
      <Text style={styles.question}>{exercice.question}</Text>

      {/* ── Choix ── */}
      {choix.map((c, index) => {
        let bgColor = COLORS.bgTertiary;
        let borderColor = COLORS.border;

        if (answered) {
          if (c.correct) {
            bgColor = 'rgba(52, 211, 153, 0.15)';
            borderColor = COLORS.success;
          } else if (index === selectedChoice && !c.correct) {
            bgColor = 'rgba(248, 113, 113, 0.15)';
            borderColor = COLORS.error;
          }
        } else if (index === selectedChoice) {
          bgColor = 'rgba(129, 140, 248, 0.15)';
          borderColor = COLORS.primary;
        }

        return (
          <TouchableOpacity
            key={index}
            style={[styles.choiceButton, { backgroundColor: bgColor, borderColor }]}
            onPress={() => handleSelect(index)}
            disabled={answered}
            activeOpacity={0.7}
          >
            <Text style={styles.choiceLetter}>
              {String.fromCharCode(65 + index)}.
            </Text>
            <Text style={styles.choiceText}>{c.texte}</Text>
          </TouchableOpacity>
        );
      })}

      {/* ── Explication ── */}
      {answered && exercice.explication ? (
        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>💡 Explication</Text>
          <Text style={styles.explanationText}>{exercice.explication}</Text>
        </View>
      ) : null}

      {/* ── Boutons ── */}
      {!answered ? (
        <TouchableOpacity
          style={[
            styles.validateButton,
            selectedChoice === null && styles.buttonDisabled,
          ]}
          onPress={handleValidate}
          disabled={selectedChoice === null}
        >
          <Text style={styles.validateText}>Valider</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentIndex + 1 < exercices.length ? 'Suivant →' : 'Voir les résultats'}
          </Text>
        </TouchableOpacity>
      )}
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
    padding: SPACING.lg,
  },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, marginBottom: SPACING.lg },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.bgTertiary,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  progressText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  question: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    lineHeight: 28,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  choiceLetter: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    width: 24,
  },
  choiceText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  explanationCard: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.info,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  explanationTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.info,
    marginBottom: SPACING.xs,
  },
  explanationText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  validateButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  validateText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  nextButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  nextText: {
    color: COLORS.textInverse,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  backButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
  },
  backButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  resultEmoji: { fontSize: 64, marginBottom: SPACING.md },
  resultTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  resultScore: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.primary,
    fontWeight: FONTS.weights.extrabold,
  },
  revisionCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    width: '100%',
  },
  revisionTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.warning,
    marginBottom: SPACING.sm,
  },
  revisionItem: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  resultActions: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    width: '100%',
    alignItems: 'center',
  },
  revisionButton: {
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  revisionButtonText: {
    color: COLORS.textInverse,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
});
