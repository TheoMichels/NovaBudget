import { inflowInputSchema, parseFrenchNumber, validate } from "../../types/validation";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, shadows } from "../../theme/colors";
import { cursorPointer } from "../../theme/webCursor";
import { MonthYearCalendar } from "../MonthYearCalendar";
import {
  formatFrenchMonthYear,
  getRelativeMonthDescription,
} from "../../utils/dateUtils";

interface AddInflowModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    targetDate: string;
    isActive: boolean;
    notes?: string;
  }) => void | Promise<unknown>;
}

export function AddInflowModal({
  visible,
  onClose,
  onSubmit,
}: AddInflowModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [targetDate, setTargetDate] = useState("2026-12"); // Default 2 months ahead
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const parsedAmount = parseFrenchNumber(amount);
      validate(inflowInputSchema, { title: title.trim(), amount: parsedAmount, targetDate, isActive: true });
      await onSubmit({
        title: title.trim(),
        amount: parsedAmount,
        targetDate: targetDate.trim() || "2026-12",
        isActive: true,
        notes: notes.trim(),
      });

      setTitle("");
      setAmount("");
      setTargetDate("2026-12");
      setIsCalendarOpen(false);
      setNotes("");
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Enregistrement impossible. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Rentrée d'Argent Exceptionnelle</Text>
              <Text style={styles.modalSubtitle}>
                Prime d'intéressement, vente de bien, remboursement ou versement.
              </Text>
            </View>
            <Pressable
              style={[styles.closeBtn, cursorPointer]}
              onPress={onClose}
              hitSlop={8}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {submitError && <Text testID="form-error" accessibilityRole="alert" style={{ color: colors.danger }}>{submitError}</Text>}
          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Motif de la rentrée</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Prime de fin d'année, Vente moto, Remboursement..."
                placeholderTextColor={colors.textMuted}
                testID="form-title" value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant net (€)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 3500"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                inputMode="decimal"
                testID="form-amount" value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Target Date with Calendar */}
            <View style={styles.inputGroup}>
              <View style={styles.dateLabelRow}>
                <Text style={styles.inputLabel}>Date prévue (Mois & Année)</Text>
                <Pressable
                  style={[styles.toggleCalendarBtn, cursorPointer]}
                  onPress={() => setIsCalendarOpen((prev) => !prev)}
                >
                  <Text style={styles.toggleCalendarBtnText}>
                    {isCalendarOpen ? "Masquer ▲" : "Choisir ▼"}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={[
                  styles.dateTrigger,
                  cursorPointer,
                  isCalendarOpen && styles.dateTriggerActive,
                ]}
                onPress={() => setIsCalendarOpen((prev) => !prev)}
              >
                <View style={styles.dateTriggerLeft}>
                  <Text style={styles.dateTriggerIcon}>📅</Text>
                  <View>
                    <Text style={styles.dateTriggerValue}>
                      {formatFrenchMonthYear(targetDate, "full")}
                    </Text>
                    <Text style={styles.dateTriggerSub}>
                      {getRelativeMonthDescription(targetDate) || "Mois de perception"}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateTriggerBadge}>
                  <Text style={styles.dateTriggerBadgeText}>{targetDate}</Text>
                </View>
              </Pressable>

              {isCalendarOpen && (
                <View style={styles.calendarContainer}>
                  <MonthYearCalendar
                    value={targetDate}
                    onChange={(newDate) => setTargetDate(newDate)}
                    accentColor={colors.inflow}
                  />
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optionnel)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Salaire de décembre, virement sécurisé..."
                placeholderTextColor={colors.textMuted}
                testID="form-notes" value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.modalActions}>
            <Pressable
              style={[styles.cancelBtn, cursorPointer]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>

            <Pressable
              style={[styles.submitBtn, cursorPointer]}
              testID="form-submit" disabled={isSubmitting} onPress={handleSubmit}
            >
              <Text style={styles.submitBtnText}>Enregistrer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    ...({ backdropFilter: "blur(6px)" } as any),
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brand,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  form: {
    maxHeight: 460,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  textInput: {
    backgroundColor: "rgba(15, 41, 34, 0.03)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.brand,
  },
  dateLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  toggleCalendarBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.inflowSoft,
  },
  toggleCalendarBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inflow,
  },
  dateTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(15, 41, 34, 0.03)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  dateTriggerActive: {
    borderColor: colors.inflow,
    backgroundColor: "rgba(37, 99, 235, 0.04)",
  },
  dateTriggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateTriggerIcon: {
    fontSize: 18,
  },
  dateTriggerValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.brand,
  },
  dateTriggerSub: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.inflow,
    marginTop: 1,
  },
  dateTriggerBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTriggerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  calendarContainer: {
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 14,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(15, 41, 34, 0.05)",
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.inflow,
    ...shadows.sm,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
