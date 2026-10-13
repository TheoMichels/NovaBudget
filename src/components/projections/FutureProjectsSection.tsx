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
import { FutureProject, ProjectFeasibility } from "../../types/projection";
import { formatFrenchMonthYear, getRelativeMonthDescription } from "../../utils/dateUtils";

interface FutureProjectsSectionProps {
  projects: FutureProject[];
  feasibilities: ProjectFeasibility[];
  onOpenAdd: () => void;
  onToggleActive: (id: string) => void;
  onRemove: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  vehicule: "🚗",
  logement: "🏡",
  voyage: "✈️",
  famille: "💍",
  fiscalite: "🏛️",
  autre: "🎯",
};

export function FutureProjectsSection({
  projects,
  feasibilities,
  onOpenAdd,
  onToggleActive,
  onRemove,
}: FutureProjectsSectionProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const isNarrow = width < 400;
  const activeProjects = projects.filter((p) => p.isActive);
  const totalActive = activeProjects.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: isNarrow ? "100%" : 200 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>3. Projets Futurs & Décaissements</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {activeProjects.length} planifié{activeProjects.length > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Achat voiture, apport immobilier, mariage ou projets majeurs avec apport.
          </Text>
        </View>

        <Pressable
          style={[styles.btnAdd, cursorPointer]}
          onPress={onOpenAdd}
        >
          <Text style={styles.btnAddText}>+ Projet Futur</Text>
        </Pressable>
      </View>

      {/* Summary Total Strip */}
      <View style={styles.totalStrip}>
        <Text style={styles.totalStripLabel}>Total apports engagés :</Text>
        <Text style={styles.totalStripVal}>-{formatEuro(totalActive)}</Text>
      </View>

      {/* Projects List */}
      <View style={styles.list}>
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aucun projet futur planifié. Cliquez sur "+ Projet Futur" pour simuler un apport !
            </Text>
          </View>
        ) : (
          projects.map((proj) => {
            const feas = feasibilities.find((f) => f.project.id === proj.id);
            const dateLabel = formatFrenchMonthYear(proj.targetDate, "full");
            const relative = getRelativeMonthDescription(proj.targetDate);
            const icon = CATEGORY_ICONS[proj.category] || "🎯";

            return (
              <View
                key={proj.id}
                style={[
                  styles.card,
                  !proj.isActive && styles.cardInactive,
                  isNarrow && styles.cardNarrow,
                ]}
              >
                {/* Main Card Header */}
                <View
                  style={[
                    styles.cardMainRow,
                    isMobile && styles.cardMainRowMobile,
                  ]}
                >
                  <View
                    style={[
                      styles.cardHeaderLeft,
                      isMobile && styles.cardHeaderLeftMobile,
                    ]}
                  >
                    <View style={styles.iconBox}>
                      <Text style={{ fontSize: 18 }}>{icon}</Text>
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.titleRowItem}>
                        <Text
                          style={[
                            styles.itemTitle,
                            !proj.isActive && styles.itemTitleInactive,
                          ]}
                          numberOfLines={1}
                        >
                          {proj.title}
                        </Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Text style={styles.metaDate}>📅 {dateLabel}</Text>
                        {relative ? (
                          <Text style={styles.metaRelative}>({relative})</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.cardHeaderRight,
                      isMobile && styles.cardHeaderRightMobile,
                    ]}
                  >
                    <Text
                      style={[
                        styles.itemAmount,
                        !proj.isActive && styles.itemAmountInactive,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      -{formatEuro(proj.amount)}
                    </Text>

                    <View style={styles.actionsCluster}>
                      <Pressable
                        style={[
                          styles.toggleBtn,
                          cursorPointer,
                          proj.isActive ? styles.toggleBtnActive : styles.toggleBtnPaused,
                        ]}
                        onPress={() => onToggleActive(proj.id)}
                      >
                        <Text
                          style={[
                            styles.toggleBtnText,
                            proj.isActive
                              ? styles.toggleBtnTextActive
                              : styles.toggleBtnTextPaused,
                          ]}
                        >
                          {proj.isActive ? "Inclus" : "Pause"}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[styles.btnDelete, cursorPointer]}
                        onPress={() => onRemove(proj.id)}
                        hitSlop={8}
                        accessibilityLabel="Supprimer"
                      >
                        <Text style={styles.btnDeleteText}>✕</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Feasibility Indicator (when active) */}
                {proj.isActive && feas && (
                  <View style={styles.feasibilityBox}>
                    <View style={styles.feasibilityRow}>
                      <View style={styles.feasibilityInfo}>
                        <Text style={styles.feasibilityLabel}>
                          Solde prévisionnel après apport :
                        </Text>
                        <Text
                          style={[
                            styles.feasibilityAmount,
                            feas.isSafe
                              ? { color: colors.primary }
                              : { color: colors.danger },
                          ]}
                        >
                          {formatEuro(feas.capitalAfterProject)}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.feasibilityBadge,
                          feas.isSafe
                            ? styles.feasibilityBadgeSafe
                            : styles.feasibilityBadgeDanger,
                        ]}
                      >
                        <Text
                          style={[
                            styles.feasibilityBadgeText,
                            feas.isSafe
                              ? { color: colors.primary }
                              : { color: colors.danger },
                          ]}
                        >
                          {feas.statusText}
                        </Text>
                      </View>
                    </View>

                    {proj.notes ? (
                      <Text style={styles.notesText}>{proj.notes}</Text>
                    ) : null}
                  </View>
                )}
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
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.brand,
    flexShrink: 1,
  },
  countBadge: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.warning,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  btnAdd: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    ...shadows.sm,
  },
  btnAddText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  totalStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(217, 119, 6, 0.06)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.15)",
  },
  totalStripLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  totalStripVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
  },
  list: {
    gap: 10,
  },
  emptyState: {
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadows.sm,
  },
  cardNarrow: {
    padding: 10,
  },
  cardInactive: {
    opacity: 0.55,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  cardMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardMainRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  cardHeaderLeftMobile: {
    width: "100%",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(15, 41, 34, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.brand,
    flexShrink: 1,
  },
  itemTitleInactive: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    flexWrap: "wrap",
  },
  metaDate: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  metaRelative: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: "600",
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  cardHeaderRightMobile: {
    width: "100%",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(15, 41, 34, 0.06)",
  },
  actionsCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: "900",
    color: "#92400E",
  },
  itemAmountInactive: {
    color: colors.textMuted,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  toggleBtnPaused: {
    backgroundColor: "rgba(15, 41, 34, 0.06)",
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: "800",
  },
  toggleBtnTextActive: {
    color: colors.primary,
  },
  toggleBtnTextPaused: {
    color: colors.textMuted,
  },
  btnDelete: {
    width: 24,
    height: 24,
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
  feasibilityBox: {
    backgroundColor: "rgba(15, 41, 34, 0.02)",
    borderRadius: 12,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 6,
  },
  feasibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  feasibilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    flex: 1,
    minWidth: 0,
  },
  feasibilityLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  feasibilityAmount: {
    fontSize: 12,
    fontWeight: "800",
  },
  feasibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  feasibilityBadgeSafe: {
    backgroundColor: colors.primarySoft,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  feasibilityBadgeDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: "rgba(220, 38, 38, 0.2)",
  },
  feasibilityBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  notesText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
