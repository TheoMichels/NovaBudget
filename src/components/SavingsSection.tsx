import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, shadows } from "../theme/colors";
import { cursorPointer } from "../theme/webCursor";
import { SavingsAccount } from "../types/savingsAccount";
import { formatEuro } from "../hooks/useForecast";

interface SavingsSectionProps {
  accounts: SavingsAccount[];
  onOpenAdd: () => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
}

export function SavingsSection({
  accounts,
  onOpenAdd,
  onUpdateAmount,
  onRemove,
}: SavingsSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  const startEditing = (acc: SavingsAccount) => {
    setEditingId(acc.id);
    setEditAmount(String(acc.amount));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount("");
  };

  const confirmEditing = (id: string) => {
    const cleaned = editAmount.replace(/\s/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateAmount(id, parsed);
    }
    setEditingId(null);
    setEditAmount("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Supports d'Épargne</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {accounts.length} support{accounts.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.addButton, cursorPointer]}
          onPress={onOpenAdd}
        >
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </Pressable>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Aucun compte d'épargne pour cette sélection.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {accounts.map((acc) => {
            const annualGain = Math.round(
              (Number(acc.amount) || 0) * ((Number(acc.rate) || 0) / 100)
            );

            const catLabel =
              acc.category === "securite"
                ? "Sécurité"
                : acc.category === "projet"
                ? "Projet"
                : "Investissement";

            const isEditing = editingId === acc.id;

            return (
              <View key={acc.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  {/* Bank Avatar */}
                  <View style={styles.bankAvatar}>
                    <Text style={styles.bankAvatarText}>
                      {(acc.bank || acc.name).substring(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  {/* Account details */}
                  <View style={styles.infoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.accountName} numberOfLines={1}>
                        {acc.name}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{catLabel}</Text>
                      </View>
                      <Text style={styles.rateText}>
                        Taux : {acc.rate || 0}%/an
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Amount & Actions */}
                <View style={styles.cardRight}>
                  {isEditing ? (
                    <View style={styles.editRow}>
                      <View style={styles.editInputWrapper}>
                        <TextInput
                          style={styles.editInput}
                          value={editAmount}
                          onChangeText={setEditAmount}
                          keyboardType="numeric"
                          autoFocus
                          selectTextOnFocus
                          onSubmitEditing={() => confirmEditing(acc.id)}
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                        />
                        <Text style={styles.editCurrency}>€</Text>
                      </View>

                      <Pressable
                        style={[styles.saveBtn, cursorPointer]}
                        onPress={() => confirmEditing(acc.id)}
                        hitSlop={6}
                      >
                        <Text style={styles.saveBtnText}>✓</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.cancelEditBtn, cursorPointer]}
                        onPress={cancelEditing}
                        hitSlop={6}
                      >
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Pressable
                        style={[styles.amountCol, styles.amountClickable, cursorPointer]}
                        onPress={() => startEditing(acc)}
                        hitSlop={6}
                      >
                        <View style={styles.amountValueRow}>
                          <Text style={styles.amountVal}>
                            {formatEuro(acc.amount)}
                          </Text>
                          <Text style={styles.editIcon}>✎</Text>
                        </View>
                        {annualGain > 0 && (
                          <Text style={styles.yieldVal}>
                            +{formatEuro(annualGain)}/an
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        style={[styles.deleteBtn, cursorPointer]}
                        onPress={() => onRemove(acc.id)}
                        hitSlop={8}
                      >
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>
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
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brand,
  },
  countBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  addButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    ...shadows.sm,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  bankAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  bankAvatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.brand,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
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
  },
  rateText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  amountClickable: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "rgba(5, 150, 105, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.12)",
  },
  amountValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  amountVal: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.brand,
  },
  editIcon: {
    fontSize: 11,
    color: colors.primary,
    opacity: 0.75,
  },
  yieldVal: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 1,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editInput: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.brand,
    minWidth: 72,
    textAlign: "right",
    paddingVertical: 2,
    ...({ outlineStyle: "none" } as any),
  },
  editCurrency: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: 4,
  },
  saveBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cancelEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 41, 34, 0.06)",
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
});
