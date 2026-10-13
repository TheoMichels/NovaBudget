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
import { ExpenseCategory } from "../../types/expense";
import { MonthYearCalendar } from "../MonthYearCalendar";
import {
  formatFrenchMonthYear,
  getRelativeMonthDescription,
} from "../../utils/dateUtils";

interface AddProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    amount: number;
    targetDate: string;
    category: ExpenseCategory;
    isActive: boolean;
    notes?: string;
  }) => void;
}

export function AddProjectModal({
  visible,
  onClose,
  onSubmit,
}: AddProjectModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [targetDate, setTargetDate] = useState("2027-10"); // Default 1 year ahead
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("vehicule");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;

    onSubmit({
      title: title.trim(),
      amount: parsedAmount,
      targetDate: targetDate.trim() || "2027-10",
      category,
      isActive: true,
      notes: notes.trim(),
    });

    setTitle("");
    setAmount("");
    setTargetDate("2027-10");
    setIsCalendarOpen(false);
    setCategory("vehicule");
    setNotes("");
    onClose();
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
              <Text style={styles.modalTitle}>Planifier un Projet Futur</Text>
              <Text style={styles.modalSubtitle}>
                Achat voiture, apport immobilier, voyage ou grand événement.
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

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du projet</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Achat Voiture, Apport Immobilier, Mariage..."
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant d'apport cible (€)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 15000"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                inputMode="decimal"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Target Date with Calendar */}
            <View style={styles.inputGroup}>
              <View style={styles.dateLabelRow}>
                <Text style={styles.inputLabel}>Échéance du projet (Mois & Année)</Text>
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
                      {getRelativeMonthDescription(targetDate) || "Échéance cible"}
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
                    accentColor={colors.primary}
                  />
                </View>
              )}
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catégorie</Text>
              <View style={styles.pillsWrap}>
                {(
                  [
                    ["vehicule", "🚗 Véhicule"],
                    ["logement", "🏡 Logement"],
                    ["voyage", "✈️ Voyage"],
                    ["famille", "💍 Famille"],
                    ["autre", "🎯 Autre"],
                  ] as const
                ).map(([catKey, catName]) => (
                  <Pressable
                    key={catKey}
                    style={[
                      styles.pillOption,
                      cursorPointer,
                      category === catKey && styles.pillOptionActive,
                    ]}
                    onPress={() => setCategory(catKey as ExpenseCategory)}
                  >
                    <Text
                      style={[
                        styles.pillOptionText,
                        category === catKey && styles.pillOptionTextActive,
                      ]}
                    >
                      {catName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes & Précisions (optionnel)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Modèle d'occasion, apport crédit..."
                placeholderTextColor={colors.textMuted}
                value={notes}
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
              onPress={handleSubmit}
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
    backgroundColor: colors.primarySoft,
  },
  toggleCalendarBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
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
    borderColor: colors.primary,
    backgroundColor: colors.primaryBackground,
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
    color: colors.primary,
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
  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pillOption: {
    backgroundColor: "rgba(15, 41, 34, 0.04)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pillOptionActive: {
    backgroundColor: colors.primary,
  },
  pillOptionText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  pillOptionTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
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
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
