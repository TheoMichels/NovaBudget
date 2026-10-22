import { savingsInputSchema, parseFrenchNumber, validate } from "../types/validation";
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
import { colors, shadows, spacing } from "../theme/colors";
import { cursorPointer } from "../theme/webCursor";
import { SavingsCategory } from "../types/savingsAccount";

interface AddSavingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: SavingsCategory;
    amount: number;
    rate: number;
    bank?: string;
  }) => void | Promise<unknown>;
}

export function AddSavingsModal({
  visible,
  onClose,
  onSubmit,
}: AddSavingsModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SavingsCategory>("securite");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("3.0");
  const [bank, setBank] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setAmount("");
    setRate("3.0");
    setBank("");
    setSubmitError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!name.trim()) {
      setSubmitError("Veuillez renseigner un nom pour ce compte.");
      return;
    }

    const parsedAmount = parseFrenchNumber(amount);
    const parsedRate = parseFrenchNumber(rate);

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      validate(savingsInputSchema, { name: name.trim(), category, amount: parsedAmount, rate: parsedRate });
      await onSubmit({
        name: name.trim(),
        category,
        amount: parsedAmount,
        rate: parsedRate,
        bank: bank.trim() || "Banque",
      });

      resetForm();
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement de l'épargne"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Ajouter un support d'épargne</Text>
              <Text style={styles.modalSubtitle}>
                Livret, assurance-vie, PEA, compte à terme...
              </Text>
            </View>
            <Pressable
              style={[styles.closeBtn, cursorPointer]}
              onPress={handleClose}
              disabled={isSubmitting}
              hitSlop={8}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.form}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {submitError ? (
              <View testID="form-error" accessibilityRole="alert" style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {submitError}</Text>
              </View>
            ) : null}

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du compte</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Livret A BoursoBank, PEA Fortuneo..."
                placeholderTextColor={colors.textMuted}
                testID="form-name" value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (submitError) setSubmitError(null);
                }}
                editable={!isSubmitting}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catégorie</Text>
              <View style={styles.pillsRow}>
                <Pressable
                  style={[
                    styles.pillOption,
                    cursorPointer,
                    category === "securite" && styles.pillOptionActiveGreen,
                  ]}
                  onPress={() => setCategory("securite")}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      category === "securite" && styles.pillOptionTextActive,
                    ]}
                  >
                    Sécurité
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.pillOption,
                    cursorPointer,
                    category === "projet" && styles.pillOptionActiveGreen,
                  ]}
                  onPress={() => setCategory("projet")}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      category === "projet" && styles.pillOptionTextActive,
                    ]}
                  >
                    Projet
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.pillOption,
                    cursorPointer,
                    category === "investissement" && styles.pillOptionActiveGreen,
                  ]}
                  onPress={() => setCategory("investissement")}
                >
                  <Text
                    style={[
                      styles.pillOptionText,
                      category === "investissement" && styles.pillOptionTextActive,
                    ]}
                  >
                    Investissement
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Amount & Rate */}
            <View style={styles.twoCols}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Montant actuel (€)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 5000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  testID="form-amount" value={amount}
                  onChangeText={(val) => {
                    setAmount(val);
                    if (submitError) setSubmitError(null);
                  }}
                  editable={!isSubmitting}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Taux annuel (%)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 3.0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  testID="form-rate" value={rate}
                  onChangeText={(val) => {
                    setRate(val);
                    if (submitError) setSubmitError(null);
                  }}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            {/* Bank name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Établissement bancaire</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: BoursoBank, BNP, Fortuneo..."
                placeholderTextColor={colors.textMuted}
                value={bank}
                onChangeText={(val) => {
                  setBank(val);
                  if (submitError) setSubmitError(null);
                }}
                editable={!isSubmitting}
              />
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.modalActions}>
            <Pressable
              style={[
                styles.cancelBtn,
                cursorPointer,
                isSubmitting && styles.btnDisabled,
              ]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>

            <Pressable
              style={[
                styles.submitBtn,
                cursorPointer,
                isSubmitting && styles.btnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Text>
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
    maxWidth: 480,
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
    marginHorizontal: -spacing.xs,
    maxHeight: 380,
  },
  formContent: {
    paddingHorizontal: spacing.xs,
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
  twoCols: {
    flexDirection: "row",
    gap: 12,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  pillOption: {
    flex: 1,
    backgroundColor: "rgba(15, 41, 34, 0.04)",
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillOptionActiveGreen: {
    backgroundColor: colors.primary,
  },
  pillOptionText: {
    fontSize: 12,
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
  btnDisabled: {
    opacity: 0.6,
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
});
