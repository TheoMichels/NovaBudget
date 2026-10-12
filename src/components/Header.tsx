import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { colors, shadows } from "../theme/colors";
import { cursorPointer } from "../theme/webCursor";

interface HeaderProps {
  activeTab: "current" | "projections";
  onSelectTab: (tab: "current" | "projections") => void;
  onOpenAddSavings: () => void;
  onOpenAddExpense: () => void;
  onOpenAddProject?: () => void;
  onOpenAddInflow?: () => void;
}

export function Header({
  activeTab,
  onSelectTab,
  onOpenAddSavings,
  onOpenAddExpense,
  onOpenAddProject,
  onOpenAddInflow,
}: HeaderProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.header}>
      {/* Brand & Title (Logo préservé à l'identique) */}
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <View>
          <Text style={styles.brandTitle}>NovaBudget</Text>
          <Text style={styles.brandSubtitle}>Épargne & Prévisions</Text>
        </View>
      </View>

      {/* Main Tab Navigation */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[
            styles.tabBtn,
            cursorPointer,
            activeTab === "current" && styles.tabBtnActive,
          ]}
          onPress={() => onSelectTab("current")}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "current" && styles.tabBtnTextActive,
            ]}
          >
            📊 Court Terme
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabBtn,
            cursorPointer,
            activeTab === "projections" && styles.tabBtnActive,
          ]}
          onPress={() => onSelectTab("projections")}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "projections" && styles.tabBtnTextActive,
            ]}
          >
            🚀 Projections & Projets
          </Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        </Pressable>
      </View>

      {/* Contextual Action Buttons */}
      <View style={styles.actionsRow}>
        {activeTab === "current" ? (
          <>
            {!isMobile && (
              <Pressable
                style={[styles.btnSecondary, cursorPointer]}
                onPress={onOpenAddExpense}
              >
                <Text style={styles.btnSecondaryText}>+ Dépense</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.btnPrimary, cursorPointer]}
              onPress={onOpenAddSavings}
            >
              <Text style={styles.btnPrimaryText}>+ Épargne</Text>
            </Pressable>
          </>
        ) : (
          <>
            {!isMobile && onOpenAddInflow && (
              <Pressable
                style={[styles.btnInflow, cursorPointer]}
                onPress={onOpenAddInflow}
              >
                <Text style={styles.btnInflowText}>+ Rentrée</Text>
              </Pressable>
            )}

            {onOpenAddProject && (
              <Pressable
                style={[styles.btnPrimary, cursorPointer]}
                onPress={onOpenAddProject}
              >
                <Text style={styles.btnPrimaryText}>+ Projet</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    zIndex: 10,
    ...({ backdropFilter: "blur(20px)" } as any),
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
    marginTop: -2,
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btnSecondary: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  btnSecondaryText: {
    color: colors.warning,
    fontWeight: "700",
    fontSize: 12,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    ...shadows.sm,
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    padding: 3,
    borderRadius: 14,
    gap: 3,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 11,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
  },
  newBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.primary,
  },
  btnInflow: {
    backgroundColor: colors.inflowSoft,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  btnInflowText: {
    color: colors.inflow,
    fontWeight: "700",
    fontSize: 12,
  },
});
