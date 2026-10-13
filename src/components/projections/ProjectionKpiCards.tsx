import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, shadows } from "../../theme/colors";
import { cursorPointer } from "../../theme/webCursor";
import { formatEuro } from "../../hooks/useForecast";
import { ProjectionForecastResult } from "../../types/projection";

interface ProjectionKpiCardsProps {
  forecast: ProjectionForecastResult;
  horizonMonths: number;
  onSelectHorizon: (months: number) => void;
  monthlySavings: number;
  safetyCushionTarget: number;
}

const HORIZONS = [
  { label: "6 mois", months: 6 },
  { label: "1 an (12m)", months: 12 },
  { label: "2 ans", months: 24 },
  { label: "3 ans", months: 36 },
  { label: "5 ans", months: 60 },
];

export function ProjectionKpiCards({
  forecast,
  horizonMonths,
  onSelectHorizon,
  monthlySavings,
  safetyCushionTarget,
}: ProjectionKpiCardsProps) {
  const isPositiveDiff = forecast.netDiff >= 0;
  const activeProjectsCount = forecast.feasibilities.filter(
    (f) =>
      f.project.isActive &&
      f.monthIndex >= 1 &&
      f.monthIndex <= forecast.horizonMonths
  ).length;

  return (
    <View style={styles.container}>
      {/* Top Controller Bar: Title + Horizon Selector */}
      <View style={styles.topBar}>
        <View style={styles.titleBlock}>
          <View style={styles.badgeRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.badgeText}>SIMULATEUR PROSPECTIF</Text>
            <Text style={styles.baseLabel}>
              • Base {formatEuro(forecast.initialSavings)}
            </Text>
          </View>
          <Text style={styles.title}>Trajectoire & Projets Futurs</Text>
          <Text style={styles.subtitle}>
            Simulation dynamique avec intérêts composés, capacité d'épargne et apports de projets.
          </Text>
        </View>

        {/* Horizon selector buttons */}
        <View style={styles.horizonSelector}>
          <Text style={styles.horizonLabel}>Horizon :</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizonPills}
            style={styles.horizonScroll}
          >
            {HORIZONS.map((h) => {
              const isSelected = h.months === horizonMonths;
              return (
                <Pressable
                  key={h.months}
                  style={[
                    styles.horizonBtn,
                    cursorPointer,
                    isSelected && styles.horizonBtnSelected,
                  ]}
                  onPress={() => onSelectHorizon(h.months)}
                >
                  <Text
                    style={[
                      styles.horizonBtnText,
                      isSelected && styles.horizonBtnTextSelected,
                    ]}
                  >
                    {h.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* 4 Metrics Grid */}
      <View style={styles.grid}>
        {/* 1. Épargne Projetée */}
        <View style={[styles.card, styles.cardFinal]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Épargne Projetée</Text>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
              <Text style={{ fontSize: 13 }}>🏁</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountText}>
              {formatEuro(forecast.finalSavings)}
            </Text>
            <View
              style={[
                styles.pillDiff,
                isPositiveDiff ? styles.pillDiffPositive : styles.pillDiffNegative,
              ]}
            >
              <Text
                style={[
                  styles.pillDiffText,
                  isPositiveDiff
                    ? { color: colors.primary }
                    : { color: colors.danger },
                ]}
              >
                {isPositiveDiff ? "+" : ""}
                {forecast.netDiffPct}%
              </Text>
            </View>
          </View>

          <View style={styles.footerNoteRow}>
            <Text style={styles.footerNoteLabel}>Gain net vs actuel :</Text>
            <Text
              style={[
                styles.footerNoteValue,
                { color: isPositiveDiff ? colors.primary : colors.danger },
              ]}
            >
              {isPositiveDiff ? "+" : ""}
              {formatEuro(forecast.netDiff)}
            </Text>
          </View>
        </View>

        {/* 2. Épargne Programmée */}
        <View style={[styles.card, styles.cardMonthly]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.inflow }]}>
              Épargne Programmée
            </Text>
            <View style={[styles.iconCircle, { backgroundColor: colors.inflowSoft }]}>
              <Text style={{ fontSize: 13 }}>📥</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={[styles.amountText, { color: colors.brand }]}>
              +{formatEuro(forecast.totalProgrammedSavings)}
            </Text>
          </View>

          <View style={styles.footerNoteRow}>
            <Text style={styles.footerNoteLabel}>Effort mensuel :</Text>
            <Text style={[styles.footerNoteValue, { color: colors.inflow }]}>
              {formatEuro(monthlySavings)} / mois
            </Text>
          </View>
          {forecast.totalInflowsIn > 0 ? (
            <View style={[styles.footerNoteRow, styles.footerSubRow]}>
              <Text style={styles.footerNoteLabel}>dont rentrées :</Text>
              <Text style={[styles.footerNoteValue, { color: colors.primary }]}>
                +{formatEuro(forecast.totalInflowsIn)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 3. Intérêts Composés */}
        <View style={[styles.card, styles.cardInterest]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.primary }]}>
              Intérêts Composés
            </Text>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
              <Text style={{ fontSize: 13 }}>✨</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={[styles.amountText, { color: colors.primary }]}>
              +{formatEuro(forecast.totalInterest)}
            </Text>
          </View>

          <View style={styles.footerNoteRow}>
            <Text style={styles.footerNoteLabel}>Taux moyen calculé :</Text>
            <Text style={[styles.footerNoteValue, { color: colors.primary }]}>
              {forecast.weightedAnnualRate}% / an
            </Text>
          </View>
        </View>

        {/* 4. Apports Projets Déduits */}
        <View style={[styles.card, styles.cardProjects]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.warning }]}>
              Apports Projets
            </Text>
            <View style={[styles.iconCircle, { backgroundColor: colors.warningSoft }]}>
              <Text style={{ fontSize: 13 }}>🚗</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={[styles.amountText, { color: "#92400E" }]}>
              {forecast.totalProjectsOut > 0
                ? `-${formatEuro(forecast.totalProjectsOut)}`
                : "0 €"}
            </Text>
          </View>

          <View style={styles.footerNoteRow}>
            <Text style={styles.footerNoteLabel}>Projets financés :</Text>
            <Text style={[styles.footerNoteValue, { color: colors.warning }]}>
              {activeProjectsCount}
            </Text>
          </View>
        </View>
      </View>

      {/* Cushion Safety Banner */}
      <View style={styles.safetyBanner}>
        <View style={styles.safetyLeft}>
          <View style={styles.shieldBadge}>
            <Text style={{ fontSize: 16 }}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.safetyTitleRow}>
              <Text style={styles.safetyTitle}>
                {forecast.isHealthy
                  ? "Matelas de Sécurité Intact"
                  : "Attention : Coussin de Sécurité Entamé"}
              </Text>
              <View
                style={[
                  styles.cushionPill,
                  forecast.isHealthy
                    ? styles.cushionPillSafe
                    : styles.cushionPillDanger,
                ]}
              >
                <Text
                  style={[
                    styles.cushionPillText,
                    forecast.isHealthy
                      ? { color: colors.primary }
                      : { color: colors.danger },
                  ]}
                >
                  {formatEuro(safetyCushionTarget)} protégés
                </Text>
              </View>
            </View>
            <Text style={styles.safetyDesc}>
              {forecast.isHealthy ? (
                <>
                  Après déduction de tous les projets à l'échéance, il vous reste{" "}
                  <Text style={{ fontWeight: "800", color: colors.primary }}>
                    +{formatEuro(forecast.cushionSurplus)}
                  </Text>{" "}
                  de marge nette libre au-dessus de votre socle d'urgence.
                </>
              ) : (
                <>
                  Vos projets dépassent votre capacité sur cet horizon. Il vous
                  manque{" "}
                  <Text style={{ fontWeight: "800", color: colors.danger }}>
                    {formatEuro(Math.abs(forecast.cushionSurplus))}
                  </Text>{" "}
                  pour préserver l'intégralité du matelas d'urgence.
                </>
              )}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusTag,
            forecast.isHealthy ? styles.statusTagSafe : styles.statusTagDanger,
          ]}
        >
          <Text
            style={[
              styles.statusTagText,
              forecast.isHealthy
                ? { color: colors.primary }
                : { color: colors.danger },
            ]}
          >
            {forecast.isHealthy ? "Santé Excellente ✅" : "Ajustement Requis ⚠️"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    ...({ backdropFilter: "blur(20px)" } as any),
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
  },
  titleBlock: {
    flex: 1,
    minWidth: 260,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  baseLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  horizonSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    maxWidth: "100%",
  },
  horizonLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    paddingLeft: 6,
    paddingRight: 2,
    flexShrink: 0,
  },
  horizonScroll: {
    flexShrink: 1,
  },
  horizonPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  horizonBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  horizonBtnSelected: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  horizonBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  horizonBtnTextSelected: {
    color: "#FFFFFF",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardFinal: {
    borderColor: "rgba(5, 150, 105, 0.35)",
  },
  cardMonthly: {
    borderColor: "rgba(37, 99, 235, 0.25)",
  },
  cardInterest: {
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  cardProjects: {
    borderColor: "rgba(217, 119, 6, 0.25)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginRight: 6,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  amountText: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.4,
  },
  pillDiff: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillDiffPositive: {
    backgroundColor: colors.primarySoft,
  },
  pillDiffNegative: {
    backgroundColor: colors.dangerSoft,
  },
  pillDiffText: {
    fontSize: 10,
    fontWeight: "700",
  },
  footerNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
    gap: 4,
  },
  footerSubRow: {
    borderTopWidth: 0,
    paddingTop: 4,
  },
  footerNoteLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "500",
  },
  footerNoteValue: {
    fontSize: 11,
    fontWeight: "700",
  },
  safetyBanner: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  safetyLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.brand,
  },
  cushionPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cushionPillSafe: {
    backgroundColor: colors.primarySoft,
  },
  cushionPillDanger: {
    backgroundColor: colors.dangerSoft,
  },
  cushionPillText: {
    fontSize: 10,
    fontWeight: "700",
  },
  safetyDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusTagSafe: {
    backgroundColor: colors.primarySoft,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  statusTagDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: "rgba(220, 38, 38, 0.3)",
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "800",
  },
});
