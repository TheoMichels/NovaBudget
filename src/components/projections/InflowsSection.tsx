import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadows } from "../../theme/colors";
import { cursorPointer } from "../../theme/webCursor";
import { formatEuro } from "../../hooks/useForecast";
import { OneOffInflow } from "../../types/projection";
import { formatFrenchMonthYear, getRelativeMonthDescription } from "../../utils/dateUtils";

interface InflowsSectionProps {
  inflows: OneOffInflow[];
  onOpenAdd: () => void;
  onToggleActive: (id: string) => void;
  onRemove: (id: string) => void;
}

export function InflowsSection({
  inflows,
  onOpenAdd,
  onToggleActive,
  onRemove,
}: InflowsSectionProps) {
  const activeInflows = inflows.filter((i) => i.isActive);
  const totalActive = activeInflows.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>2. Rentrées Exceptionnelles</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {activeInflows.length} active{activeInflows.length > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Primes, remboursements, ventes de biens ou versements ponctuels.
          </Text>
        </View>

        <Pressable
          style={[styles.btnAdd, cursorPointer]}
          onPress={onOpenAdd}
        >
          <Text style={styles.btnAddText}>+ Rentrée</Text>
        </Pressable>
      </View>

      {/* Total Active Banner */}
      <View style={styles.totalStrip}>
        <Text style={styles.totalStripLabel}>Total rentrées intégrées :</Text>
        <Text style={styles.totalStripVal}>+{formatEuro(totalActive)}</Text>
      </View>

      {/* List */}
      <View style={styles.list}>
        {inflows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aucune rentrée d'argent enregistrée pour le moment.
            </Text>
          </View>
        ) : (
          inflows.map((inf) => {
            const dateLabel = formatFrenchMonthYear(inf.targetDate, "short");
            const relative = getRelativeMonthDescription(inf.targetDate);
            return (
              <View
                key={inf.id}
                style={[
                  styles.card,
                  !inf.isActive && styles.cardInactive,
                ]}
              >
                <View style={styles.cardLeft}>
                  <Pressable
                    style={[
                      styles.checkbox,
                      cursorPointer,
                      inf.isActive && styles.checkboxActive,
                    ]}
                    onPress={() => onToggleActive(inf.id)}
                    hitSlop={8}
                  >
                    {inf.isActive && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </Pressable>

                  <View style={{ flex: 1 }}>
                    <View style={styles.itemTitleRow}>
                      <Text
                        style={[
                          styles.itemTitle,
                          !inf.isActive && styles.itemTitleInactive,
                        ]}
                        numberOfLines={1}
                      >
                        {inf.title}
                      </Text>
                    </View>

                    <View style={styles.itemMetaRow}>
                      <Text style={styles.dateLabel}>📅 {dateLabel}</Text>
                      {relative ? (
                        <Text style={styles.relativeLabel}>({relative})</Text>
                      ) : null}
                      {inf.notes ? (
                        <Text style={styles.notesText} numberOfLines={1}>
                          • {inf.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Text
                    style={[
                      styles.itemAmount,
                      !inf.isActive && styles.itemAmountInactive,
                    ]}
                  >
                    +{formatEuro(inf.amount)}
                  </Text>
                  <Pressable
                    style={[styles.btnDelete, cursorPointer]}
                    onPress={() => onRemove(inf.id)}
                    hitSlop={8}
                    accessibilityLabel="Supprimer"
                  >
                    <Text style={styles.btnDeleteText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
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
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.brand,
  },
  countBadge: {
    backgroundColor: colors.inflowSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.inflow,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  btnAdd: {
    backgroundColor: colors.inflowSoft,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  btnAddText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.inflow,
  },
  totalStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(37, 99, 235, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.15)",
  },
  totalStripLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  totalStripVal: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.inflow,
  },
  list: {
    gap: 8,
  },
  emptyState: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    ...shadows.sm,
  },
  cardInactive: {
    opacity: 0.55,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 41, 34, 0.04)",
  },
  checkboxActive: {
    backgroundColor: colors.inflow,
    borderColor: colors.inflow,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.brand,
  },
  itemTitleInactive: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    flexWrap: "wrap",
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  relativeLabel: {
    fontSize: 10,
    color: colors.inflow,
    fontWeight: "600",
  },
  notesText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.inflow,
  },
  itemAmountInactive: {
    color: colors.textMuted,
  },
  btnDelete: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDeleteText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "700",
  },
});
