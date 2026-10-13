import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
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
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isNarrow = width < 420;
  const currentTotal = monthlyConfig.monthlyTotal || 0;

  // Estimated monthly interest currently generated
  const estimatedMonthlyInterest = Math.round(
    (initialSavings * (weightedAnnualRate / 100)) / 12
  );

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: isNarrow ? "100%" : 200 }}>
          <Text style={styles.title} numberOfLines={1}>1. Capacité d'Épargne Mensuelle</Text>
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

        {isNarrow ? (
          /* Narrow Screen Layout: Centered amount + row of 4 steppers */
          <View style={styles.masterAmountColNarrow}>
            <View style={styles.amountDisplayNarrow}>
              <Text
                style={styles.amountValueMobile}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatEuro(currentTotal)}
              </Text>
              <Text style={styles.amountUnit}>/ mois</Text>
            </View>

            <View style={styles.steppersRowNarrow}>
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
          </View>
        ) : (
          /* Standard / Desktop Layout: Steppers framing the amount */
          <View style={[styles.masterAmountRow, isMobile && styles.masterAmountRowMobile]}>
            <View style={styles.stepperGroup}>
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
            </View>

            <View style={[styles.amountDisplay, isMobile && styles.amountDisplayMobile]}>
              <Text
                style={[styles.amountValue, isMobile && styles.amountValueMobile]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatEuro(currentTotal)}
              </Text>
              <Text style={styles.amountUnit}>/ mois</Text>
            </View>

            <View style={styles.stepperGroup}>
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
          </View>
        )}

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
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(20px)" } as unknown as ViewStyle)
      : {}),
    gap: 14,
  },
  containerMobile: {
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.brand,
    flexShrink: 1,
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
  masterAmountColNarrow: {
    alignItems: "center",
    width: "100%",
    gap: 8,
  },
  amountDisplayNarrow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
  },
  steppersRowNarrow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  masterAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    width: "100%",
  },
  masterAmountRowMobile: {
    gap: 6,
  },
  stepperGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
    paddingHorizontal: 10,
  },
  amountDisplayMobile: {
    paddingHorizontal: 4,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  amountValueMobile: {
    fontSize: 22,
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
