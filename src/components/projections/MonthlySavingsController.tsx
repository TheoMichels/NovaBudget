import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadows } from "../../theme/colors";
import { cursorPointer } from "../../theme/webCursor";
import { formatEuro } from "../../hooks/useForecast";
import { MonthlyContributionConfig } from "../../types/projection";

interface MonthlySavingsControllerProps {
  monthlyConfig: MonthlyContributionConfig;
  onUpdateTotal: (total: number) => void;
  weightedAnnualRate: number;
  initialSavings: number;
}

const PRESET_AMOUNTS = [400, 800, 1200, 1500];

export function MonthlySavingsController({
  monthlyConfig,
  onUpdateTotal,
  weightedAnnualRate,
  initialSavings,
}: MonthlySavingsControllerProps) {
  const currentTotal = monthlyConfig.monthlyTotal || 0;

  // Estimated monthly interest currently generated
  const estimatedMonthlyInterest = Math.round(
    (initialSavings * (weightedAnnualRate / 100)) / 12
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>1. Capacité d'Épargne Mensuelle</Text>
          <Text style={styles.subtitle}>
            Montant récurrent injecté chaque mois sur vos livrets & investissements.
          </Text>
        </View>
        <View style={styles.pillRecurring}>
          <Text style={styles.pillRecurringText}>Récurrent</Text>
        </View>
      </View>

      {/* Main Total Box with Steppers */}
      <View style={styles.masterBox}>
        <Text style={styles.masterLabel}>EFFORT D'ÉPARGNE MENSUEL</Text>
        <View style={styles.masterAmountRow}>
          <Pressable
            style={[styles.stepperBtn, cursorPointer]}
            onPress={() => onUpdateTotal(Math.max(0, currentTotal - 100))}
            accessibilityLabel="Diminuer de 100€"
          >
            <Text style={styles.stepperBtnText}>-100</Text>
          </Pressable>

          <Pressable
            style={[styles.stepperBtn, cursorPointer]}
            onPress={() => onUpdateTotal(Math.max(0, currentTotal - 50))}
            accessibilityLabel="Diminuer de 50€"
          >
            <Text style={styles.stepperBtnText}>-50</Text>
          </Pressable>

          <View style={styles.amountDisplay}>
            <Text style={styles.amountValue}>{formatEuro(currentTotal)}</Text>
            <Text style={styles.amountUnit}>/ mois</Text>
          </View>

          <Pressable
            style={[styles.stepperBtn, cursorPointer]}
            onPress={() => onUpdateTotal(currentTotal + 50)}
            accessibilityLabel="Augmenter de 50€"
          >
            <Text style={styles.stepperBtnText}>+50</Text>
          </Pressable>

          <Pressable
            style={[styles.stepperBtn, cursorPointer]}
            onPress={() => onUpdateTotal(currentTotal + 100)}
            accessibilityLabel="Augmenter de 100€"
          >
            <Text style={styles.stepperBtnText}>+100</Text>
          </Pressable>
        </View>

        {/* Quick Presets */}
        <View style={styles.presetsRow}>
          <Text style={styles.presetsLabel}>Scénarios :</Text>
          {PRESET_AMOUNTS.map((amt) => {
            const isSelected = currentTotal === amt;
            return (
              <Pressable
                key={amt}
                style={[
                  styles.presetChip,
                  cursorPointer,
                  isSelected && styles.presetChipActive,
                ]}
                onPress={() => onUpdateTotal(amt)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    isSelected && styles.presetChipTextActive,
                  ]}
                >
                  {formatEuro(amt)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Compound Interest Automatic Note */}
      <View style={styles.interestNote}>
        <Text style={styles.interestNoteIcon}>💡</Text>
        <Text style={styles.interestNoteText}>
          <Text style={{ fontWeight: "800", color: colors.brand }}>
            Rendement passif automatique :
          </Text>{" "}
          Vos livrets & investissements actuels génèrent déjà{" "}
          <Text style={{ fontWeight: "800", color: colors.primary }}>
            ~+{formatEuro(estimatedMonthlyInterest)} / mois
          </Text>{" "}
          d'intérêts d'après leurs taux réels (3% Livret A/LDDS, 7% PEA, 4.5%
          Assurance-Vie).
        </Text>
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
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.brand,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pillRecurring: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillRecurringText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  masterBox: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 10,
  },
  masterLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  masterAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  amountDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    paddingHorizontal: 12,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  amountUnit: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  presetsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    width: "100%",
  },
  presetsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(15, 41, 34, 0.04)",
  },
  presetChipActive: {
    backgroundColor: colors.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: "#FFFFFF",
  },
  interestNote: {
    backgroundColor: colors.primaryBackground,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  interestNoteIcon: {
    fontSize: 14,
  },
  interestNoteText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    flex: 1,
  },
});
