import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { colors, shadows } from "../theme/colors";
import { cursorPointer } from "../theme/webCursor";
import { formatEuro } from "../hooks/useForecast";

interface SimulatorWaterfallProps {
  initialSavings: number;
  expensesAmount: number;
  residualSavings: number;
  cushionPct: number;
  freePct: number;
  expensesPct: number;
  retentionRate: string;
  safetyCushionTarget: number;
  onUpdateSafetyCushionTarget?: (newTarget: number) => void;
}

export function SimulatorWaterfall({
  initialSavings,
  expensesAmount,
  residualSavings,
  cushionPct,
  freePct,
  expensesPct,
  retentionRate,
  safetyCushionTarget,
  onUpdateSafetyCushionTarget,
}: SimulatorWaterfallProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isNarrow = width < 420;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(safetyCushionTarget));

  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(safetyCushionTarget));
    }
  }, [safetyCushionTarget, isEditing]);

  const handleStartEdit = () => {
    if (!onUpdateSafetyCushionTarget) return;
    setEditValue(String(safetyCushionTarget));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditValue(String(safetyCushionTarget));
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    const cleaned = editValue.replace(/\s/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateSafetyCushionTarget?.(parsed);
    } else {
      setEditValue(String(safetyCushionTarget));
    }
    setIsEditing(false);
  };

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: isNarrow ? "100%" : 220 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Simulation Prévisionnelle d'Épargne</Text>
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>Temps Réel</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Transition dynamique entre votre épargne, vos projets et le capital restant.
          </Text>
        </View>

        {isEditing ? (
          <View
            style={[
              styles.cushionTargetBox,
              styles.cushionTargetBoxEditing,
              isNarrow && styles.cushionTargetBoxNarrow,
            ]}
          >
            <Text style={styles.cushionTargetLabel}>Seuil de sécurité :</Text>
            <View style={styles.editRow}>
              <View style={styles.editInputWrapper}>
                <TextInput
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType="numeric"
                  autoFocus
                  selectTextOnFocus
                  onSubmitEditing={handleSaveEdit}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.editCurrency}>€</Text>
              </View>

              <Pressable
                style={[styles.saveBtn, cursorPointer]}
                onPress={handleSaveEdit}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Valider"
              >
                <Text style={styles.saveBtnText}>✓</Text>
              </Pressable>

              <Pressable
                style={[styles.cancelBtn, cursorPointer]}
                onPress={handleCancelEdit}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Annuler"
              >
                <Text style={styles.cancelBtnText}>✕</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[
              styles.cushionTargetBox,
              isNarrow && styles.cushionTargetBoxNarrow,
              onUpdateSafetyCushionTarget && cursorPointer,
            ]}
            onPress={handleStartEdit}
            accessibilityRole="button"
            accessibilityLabel="Modifier le seuil de sécurité"
          >
            <Text style={styles.cushionTargetLabel}>Seuil de sécurité :</Text>
            <View style={styles.cushionValRow}>
              <Text style={styles.cushionTargetVal}>
                {formatEuro(safetyCushionTarget)}
              </Text>
              {onUpdateSafetyCushionTarget && (
                <Text style={styles.editIcon}>✎</Text>
              )}
            </View>
          </Pressable>
        )}
      </View>

      {/* Numerical Waterfall summary */}
      <View style={[styles.stepsRow, isMobile && styles.stepsRowMobile]}>
        <View style={[styles.stepItem, isMobile && styles.stepItemMobile]}>
          <Text style={[styles.stepLabel, isMobile && styles.stepLabelMobile]} numberOfLines={1}>
            Épargne départ
          </Text>
          <Text
            style={[
              styles.stepVal,
              { color: colors.brand },
              isMobile && styles.stepValMobile,
            ]}
            numberOfLines={1}
          >
            {formatEuro(initialSavings)}
          </Text>
        </View>

        <Text style={[styles.operator, isMobile && styles.operatorMobile]}>-</Text>

        <View style={[styles.stepItem, isMobile && styles.stepItemMobile]}>
          <Text style={[styles.stepLabel, isMobile && styles.stepLabelMobile]} numberOfLines={1}>
            Dépenses engagées
          </Text>
          <Text
            style={[
              styles.stepVal,
              { color: "#92400E" },
              isMobile && styles.stepValMobile,
            ]}
            numberOfLines={1}
          >
            {expensesAmount > 0 ? `-${formatEuro(expensesAmount)}` : "0 €"}
          </Text>
        </View>

        <Text style={[styles.operator, isMobile && styles.operatorMobile]}>=</Text>

        <View style={[styles.stepItem, isMobile && styles.stepItemMobile]}>
          <Text style={[styles.stepLabel, isMobile && styles.stepLabelMobile]} numberOfLines={1}>
            Épargne résiduelle
          </Text>
          <Text
            style={[
              styles.stepVal,
              { color: colors.primary },
              isMobile && styles.stepValMobile,
            ]}
            numberOfLines={1}
          >
            {formatEuro(residualSavings)}
          </Text>
        </View>
      </View>

      {/* Segmented Bar */}
      <View style={styles.barContainer}>
        {cushionPct > 0 && (
          <View
            style={[
              styles.barSegment,
              { width: `${cushionPct}%`, backgroundColor: colors.primary },
            ]}
          >
            {cushionPct >= (isMobile ? 24 : 16) ? (
              <Text style={styles.barText} numberOfLines={1}>
                Sécurité ({cushionPct}%)
              </Text>
            ) : cushionPct >= 12 ? (
              <Text style={styles.barText} numberOfLines={1}>
                {cushionPct}%
              </Text>
            ) : null}
          </View>
        )}
        {freePct > 0 && (
          <View
            style={[
              styles.barSegment,
              { width: `${freePct}%`, backgroundColor: "#34D399" },
            ]}
          >
            {freePct >= (isMobile ? 24 : 16) ? (
              <Text style={[styles.barText, { color: colors.brand }]} numberOfLines={1}>
                Confort ({freePct}%)
              </Text>
            ) : freePct >= 12 ? (
              <Text style={[styles.barText, { color: colors.brand }]} numberOfLines={1}>
                {freePct}%
              </Text>
            ) : null}
          </View>
        )}
        {expensesPct > 0 && (
          <View
            style={[
              styles.barSegment,
              { width: `${expensesPct}%`, backgroundColor: "#FBBF24" },
            ]}
          >
            {expensesPct >= (isMobile ? 24 : 16) ? (
              <Text style={[styles.barText, { color: "#78350F" }]} numberOfLines={1}>
                Projets (-{expensesPct}%)
              </Text>
            ) : expensesPct >= 12 ? (
              <Text style={[styles.barText, { color: "#78350F" }]} numberOfLines={1}>
                -{expensesPct}%
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Legend & Retention */}
      <View style={styles.legendRow}>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Socle sécurité</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#34D399" }]} />
            <Text style={styles.legendText}>Marge libre</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#FBBF24" }]} />
            <Text style={styles.legendText}>Projets financés</Text>
          </View>
        </View>

        <Text style={styles.retentionText}>
          Taux de conservation :{" "}
          <Text style={{ fontWeight: "800", color: colors.primary }}>
            {retentionRate}%
          </Text>
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
    borderColor: "rgba(16, 185, 129, 0.3)",
    ...shadows.sm,
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(20px)" } as unknown as ViewStyle)
      : {}),
  },
  containerMobile: {
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brand,
  },
  liveTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cushionTargetBox: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  cushionTargetBoxNarrow: {
    width: "100%",
    alignItems: "flex-start",
  },
  cushionTargetBoxEditing: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.primary,
  },
  cushionTargetLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
  },
  cushionValRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  cushionTargetVal: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.brand,
  },
  editIcon: {
    fontSize: 11,
    color: colors.primary,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  editInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editInput: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brand,
    minWidth: 64,
    textAlign: "right",
    paddingVertical: 1,
    ...(Platform.OS === "web"
      ? ({ outlineStyle: "none" } as unknown as TextStyle)
      : {}),
  },
  editCurrency: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: 3,
  },
  saveBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cancelBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 41, 34, 0.06)",
  },
  cancelBtnText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepsRowMobile: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  stepItem: {
    alignItems: "flex-start",
  },
  stepItemMobile: {
    flex: 1,
    minWidth: 0,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: 2,
  },
  stepLabelMobile: {
    fontSize: 9,
  },
  stepVal: {
    fontSize: 15,
    fontWeight: "800",
  },
  stepValMobile: {
    fontSize: 13,
  },
  operator: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMuted,
  },
  operatorMobile: {
    fontSize: 14,
    marginHorizontal: 0,
  },
  barContainer: {
    height: 24,
    backgroundColor: "rgba(15, 41, 34, 0.06)",
    borderRadius: 12,
    padding: 2,
    flexDirection: "row",
    gap: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  barSegment: {
    height: "100%",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    overflow: "hidden",
  },
  barText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItems: {
    flexDirection: "row",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  retentionText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
