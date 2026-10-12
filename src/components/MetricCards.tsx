import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, shadows } from "../theme/colors";
import { formatEuro } from "../hooks/useForecast";

interface MetricCardsProps {
  totalSavings: number;
  accountsCount: number;
  totalActiveExpenses: number;
  activeExpensesCount: number;
  postTotalSavings: number;
}

export function MetricCards({
  totalSavings,
  accountsCount,
  totalActiveExpenses,
  activeExpensesCount,
  postTotalSavings,
}: MetricCardsProps) {
  return (
    <View style={styles.grid}>
      {/* 1. Épargne Actuelle Totale */}
      <View style={[styles.card, styles.cardSavings]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Épargne Actuelle</Text>
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ fontSize: 13 }}>💰</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountText}>{formatEuro(totalSavings)}</Text>
          <View style={styles.pillGreen}>
            <Text style={styles.pillGreenText}>Dispo</Text>
          </View>
        </View>

        <View style={styles.footerNoteRow}>
          <Text style={styles.footerNoteLabel}>Supports actifs :</Text>
          <Text style={styles.footerNoteValue}>
            {accountsCount} compte{accountsCount > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* 2. Dépenses Planifiées */}
      <View style={[styles.card, styles.cardExpenses]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardLabel, { color: colors.warning }]}>
            Dépenses Prévues
          </Text>
          <View style={[styles.iconCircle, { backgroundColor: colors.warningSoft }]}>
            <Text style={{ fontSize: 13 }}>📉</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amountText, { color: "#92400E" }]}>
            {totalActiveExpenses > 0
              ? `-${formatEuro(totalActiveExpenses)}`
              : "0 €"}
          </Text>
          <View style={styles.pillAmber}>
            <Text style={styles.pillAmberText}>
              {activeExpensesCount} projet{activeExpensesCount > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.footerNoteRow}>
          <Text style={styles.footerNoteLabel}>Horizon temporel :</Text>
          <Text style={styles.footerNoteValue}>Fin 2026</Text>
        </View>
      </View>

      {/* 3. Épargne Finale Prévisionnelle */}
      <View style={[styles.card, styles.cardForecast]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardLabel, { color: colors.primary }]}>
            Épargne Prévisionnelle
          </Text>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Text style={{ fontSize: 13, color: "#FFFFFF" }}>🎯</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amountText, { color: colors.primary }]}>
            {formatEuro(postTotalSavings)}
          </Text>
          <View style={styles.pillStatus}>
            <Text style={styles.pillStatusText}>Sain</Text>
          </View>
        </View>

        <Text style={styles.cardSubtext}>
          Solde net après règlement de toutes les dépenses prévues
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 260,
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    ...({ backdropFilter: "blur(20px)" } as any),
  },
  cardSavings: {
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  cardExpenses: {
    borderColor: "rgba(217, 119, 6, 0.25)",
  },
  cardForecast: {
    borderColor: "rgba(5, 150, 105, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.90)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 16,
  },
  amountText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.5,
  },
  pillGreen: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillGreenText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  pillAmber: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillAmberText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.warning,
  },
  pillStatus: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  footerNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
  },
  footerNoteLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  footerNoteValue: {
    fontSize: 12,
    color: colors.brand,
    fontWeight: "700",
  },
  cardSubtext: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});
