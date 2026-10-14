import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { colors, shadows } from "../theme/colors";
import { formatEuro } from "../hooks/useForecast";

export interface UnifiedKpiCardsProps {
  totalSavings: number; // Épargne actuelle
  plannedExpensesUntilDate: number; // Dépenses prévues calculées jusqu'à la date sélectionnée
  plannedExpensesCount: number; // Nombre de dépenses prévues jusqu'à cette date
  projectedSavings: number; // Épargne projetée exacte (intérêts et rentrées inclus)
  selectedDateLabel: string; // Ex: 'Août 2027'
  inflowsUntilDate?: number; // Rentrées d'argent actives cumulées jusqu'à la date sélectionnée
  accumulatedInterestUntilDate?: number; // Intérêts cumulés générés par les livrets jusqu'à cette date
}

export function UnifiedKpiCards({
  totalSavings,
  plannedExpensesUntilDate,
  plannedExpensesCount,
  projectedSavings,
  selectedDateLabel,
  inflowsUntilDate = 0,
  accumulatedInterestUntilDate = 0,
}: UnifiedKpiCardsProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isNarrow = width < 400;

  const isDeficit = projectedSavings < 0;
  const isWarning =
    !isDeficit && totalSavings > 0 && projectedSavings < totalSavings * 0.25;

  const hasPositiveGains =
    accumulatedInterestUntilDate > 0 || inflowsUntilDate > 0;

  const projectedStatusText = isDeficit
    ? "Déficit"
    : isWarning
    ? "Vigilance"
    : "Sain";

  const projectedStatusColor = isDeficit
    ? colors.danger
    : isWarning
    ? colors.warning
    : colors.primary;

  const projectedStatusBg = isDeficit
    ? colors.dangerSoft
    : isWarning
    ? colors.warningSoft
    : colors.positiveSoft;

  const cardResponsiveStyle: ViewStyle = {
    width: isMobile ? "100%" : undefined,
    minWidth: isMobile ? "100%" : 240,
  };

  return (
    <View style={styles.container}>
      {/* 1. Épargne actuelle */}
      <View
        style={[
          styles.card,
          styles.cardSavings,
          cardResponsiveStyle,
          isMobile && styles.cardMobile,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel} numberOfLines={1}>
            Épargne actuelle
          </Text>
          <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
            <Text style={styles.iconText}>💰</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text
            style={[
              styles.amountText,
              styles.amountSavings,
              isNarrow && styles.amountTextNarrow,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatEuro(totalSavings)}
          </Text>
          <View style={styles.pillGreen}>
            <Text style={styles.pillGreenText}>Dispo</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Total disponible</Text>
        </View>
      </View>

      {/* 2. Dépenses prévues */}
      <View
        style={[
          styles.card,
          styles.cardExpenses,
          cardResponsiveStyle,
          isMobile && styles.cardMobile,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text
            style={[styles.cardLabel, { color: colors.warning }]}
            numberOfLines={1}
          >
            Dépenses prévues
          </Text>
          <View style={[styles.iconBadge, { backgroundColor: colors.warningSoft }]}>
            <Text style={styles.iconText}>🗓️</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text
            style={[
              styles.amountText,
              styles.amountExpenses,
              isNarrow && styles.amountTextNarrow,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {plannedExpensesUntilDate > 0
              ? `-${formatEuro(plannedExpensesUntilDate)}`
              : "0 €"}
          </Text>
          <View style={styles.pillAmber}>
            <Text style={styles.pillAmberText} numberOfLines={1}>
              {`jusqu'à ${selectedDateLabel}`}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {plannedExpensesCount === 0
              ? "Aucune dépense"
              : `${plannedExpensesCount} dépense${plannedExpensesCount > 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>

      {/* 3. Épargne projetée */}
      <View
        style={[
          styles.card,
          styles.cardProjected,
          cardResponsiveStyle,
          isMobile && styles.cardMobile,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text
            style={[
              styles.cardLabel,
              { color: isDeficit ? colors.danger : colors.primary },
            ]}
            numberOfLines={1}
          >
            Épargne projetée
          </Text>
          <View style={[styles.iconBadge, { backgroundColor: projectedStatusBg }]}>
            <Text style={styles.iconText}>🎯</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text
            style={[
              styles.amountText,
              { color: projectedStatusColor },
              isNarrow && styles.amountTextNarrow,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatEuro(projectedSavings)}
          </Text>
          <View style={[styles.pillStatus, { backgroundColor: projectedStatusBg }]}>
            <Text
              style={[styles.pillStatusText, { color: projectedStatusColor }]}
            >
              {projectedStatusText}
            </Text>
          </View>
        </View>

        <View style={styles.footerCol}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText} numberOfLines={1}>
              Solde net estimé (intérêts & rentrées inclus)
            </Text>
          </View>
          {hasPositiveGains && (
            <View style={styles.gainsRow}>
              {accumulatedInterestUntilDate > 0 && (
                <View style={styles.miniInterestPill}>
                  <Text style={styles.miniInterestText} numberOfLines={1}>
                    +{formatEuro(accumulatedInterestUntilDate)} intérêts
                  </Text>
                </View>
              )}
              {inflowsUntilDate > 0 && (
                <View style={styles.miniInflowPill}>
                  <Text style={styles.miniInflowText} numberOfLines={1}>
                    +{formatEuro(inflowsUntilDate)} rentrées
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    width: "100%",
  },
  card: {
    flex: 1,
    minWidth: 240,
    backgroundColor: colors.panel,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "space-between",
    ...shadows.sm,
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(20px)" } as unknown as ViewStyle)
      : {}),
  },
  cardMobile: {
    padding: 15,
  },
  cardSavings: {
    borderColor: "rgba(13, 148, 136, 0.22)",
  },
  cardExpenses: {
    borderColor: "rgba(245, 158, 11, 0.28)",
  },
  cardProjected: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "rgba(13, 148, 136, 0.35)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: {
    fontSize: 14,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  amountTextNarrow: {
    fontSize: 21,
  },
  amountSavings: {
    color: colors.brand,
  },
  amountExpenses: {
    color: "#B45309",
  },
  pillGreen: {
    backgroundColor: colors.positiveSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.2)",
    flexShrink: 0,
  },
  pillGreenText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  pillAmber: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
    maxWidth: 140,
    flexShrink: 1,
  },
  pillAmberText: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "700",
  },
  pillStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
  },
  pillStatusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  footerCol: {
    gap: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  gainsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  miniInterestPill: {
    backgroundColor: colors.primaryBackground,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.25)",
  },
  miniInterestText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  miniInflowPill: {
    backgroundColor: colors.inflowSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.25)",
  },
  miniInflowText: {
    color: colors.inflow,
    fontSize: 10,
    fontWeight: "700",
  },
});
