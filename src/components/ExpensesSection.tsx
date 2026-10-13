import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { colors, shadows } from "../theme/colors";
import { cursorPointer } from "../theme/webCursor";
import { Expense } from "../types/expense";
import { formatEuro } from "../hooks/useForecast";
import { MonthYearCalendar } from "./MonthYearCalendar";
import { formatFrenchMonthYear } from "../utils/dateUtils";

interface ExpensesSectionProps {
  expenses: Expense[];
  onOpenAdd: () => void;
  onToggleActive: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateDate?: (id: string, targetDate: string) => void;
}

export function ExpensesSection({
  expenses,
  onOpenAdd,
  onToggleActive,
  onRemove,
  onUpdateDate,
}: ExpensesSectionProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isNarrow = width < 400;

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [tempDate, setTempDate] = useState<string>("");

  const handleOpenDateEdit = (exp: Expense) => {
    if (!onUpdateDate) return;
    setEditingExpense(exp);
    setTempDate(exp.targetDate);
  };

  const handleSaveDateEdit = () => {
    if (editingExpense && tempDate) {
      onUpdateDate?.(editingExpense.id, tempDate);
    }
    setEditingExpense(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title} numberOfLines={1}>Dépenses Importantes</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {expenses.length} projet{expenses.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.addButton, cursorPointer]}
          onPress={onOpenAdd}
        >
          <Text style={styles.addButtonText}>+ Planifier</Text>
        </Pressable>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune dépense planifiée.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {expenses.map((exp) => {
            return (
              <View
                key={exp.id}
                style={[
                  styles.card,
                  !exp.isActive && styles.cardInactive,
                  isNarrow && styles.cardNarrow,
                ]}
              >
                {/* Left side: Checkbox + details */}
                <View style={styles.cardLeft}>
                  <Pressable
                    style={[styles.checkbox, cursorPointer]}
                    onPress={() => onToggleActive(exp.id)}
                    hitSlop={6}
                  >
                    <View
                      style={[
                        styles.checkboxInner,
                        exp.isActive && styles.checkboxActive,
                      ]}
                    >
                      {exp.isActive && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Pressable>

                  <View style={styles.infoCol}>
                    <Text
                      style={[
                        styles.titleText,
                        !exp.isActive && styles.titleTextInactive,
                      ]}
                      numberOfLines={1}
                    >
                      {exp.title}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{exp.category}</Text>
                      </View>
                      <Pressable
                        style={[
                          styles.dateBadge,
                          onUpdateDate && cursorPointer,
                        ]}
                        onPress={() => handleOpenDateEdit(exp)}
                        hitSlop={4}
                      >
                        <Text style={styles.dateText} numberOfLines={1}>
                          📅 {formatFrenchMonthYear(exp.targetDate, isMobile ? "short" : "full")}
                        </Text>
                        {onUpdateDate && (
                          <Text style={styles.dateEditPencil}>✎</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Right side: Amount & Delete */}
                <View style={styles.cardRight}>
                  <View style={styles.amountCol}>
                    <Text
                      style={[
                        styles.amountVal,
                        !exp.isActive && styles.amountValInactive,
                        isNarrow && styles.amountValNarrow,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      -{formatEuro(exp.amount)}
                    </Text>
                    {exp.notes ? (
                      <Text style={styles.catText} numberOfLines={1}>
                        {exp.notes}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    style={[styles.deleteBtn, cursorPointer]}
                    onPress={() => onRemove(exp.id)}
                    hitSlop={8}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Tip Card */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          Cochez ou décochez un projet pour tester en direct son impact sur votre matelas d'épargne futur (simulation "What-if"). Cliquez sur la date pour la modifier.
        </Text>
      </View>

      {/* Quick Date Edit Modal */}
      {editingExpense && (
        <Modal
          visible={!!editingExpense}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingExpense(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, isNarrow && styles.modalCardNarrow]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalTitle}>Modifier l'échéance</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {editingExpense.title}
                  </Text>
                </View>
                <Pressable
                  style={[styles.closeBtn, cursorPointer]}
                  onPress={() => setEditingExpense(null)}
                  hitSlop={8}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
              </View>

              <MonthYearCalendar
                value={tempDate}
                onChange={(newDate) => setTempDate(newDate)}
                accentColor={colors.warning}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.cancelBtn, cursorPointer]}
                  onPress={() => setEditingExpense(null)}
                >
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, cursorPointer]}
                  onPress={handleSaveDateEdit}
                >
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brand,
    flexShrink: 1,
  },
  countBadge: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.warning,
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.3)",
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.warning,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    ...shadows.sm,
  },
  cardNarrow: {
    padding: 10,
    gap: 6,
  },
  cardInactive: {
    opacity: 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  checkbox: {
    padding: 2,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brand,
    flexShrink: 1,
  },
  titleTextInactive: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  catBadge: {
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(217, 119, 6, 0.08)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
  },
  dateText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: "600",
  },
  dateEditPencil: {
    fontSize: 10,
    color: colors.warning,
    opacity: 0.8,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  amountVal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#92400E",
  },
  amountValNarrow: {
    fontSize: 13,
  },
  amountValInactive: {
    color: colors.textMuted,
  },
  catText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "capitalize",
    marginTop: 1,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 41, 34, 0.04)",
  },
  deleteBtnText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  tipCard: {
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipIcon: {
    fontSize: 14,
  },
  tipText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(6px)" } as unknown as ViewStyle)
      : {}),
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
  modalCardNarrow: {
    padding: 14,
    borderRadius: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
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
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.warning,
    ...shadows.sm,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
