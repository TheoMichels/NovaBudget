import React, { useState } from "react";
import {
  Image,
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
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "./AuthModal";

interface HeaderProps {
  activeTab: "current" | "projections";
  onSelectTab: (tab: "current" | "projections") => void;
  onOpenAddSavings: () => void;
  onOpenAddExpense: () => void;
  onOpenAddProject?: () => void;
  onOpenAddInflow?: () => void;
  onOpenAuth?: () => void;
}

export function Header({
  activeTab,
  onSelectTab,
  onOpenAddSavings,
  onOpenAddExpense,
  onOpenAddProject,
  onOpenAddInflow,
  onOpenAuth,
}: HeaderProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { user, isAuthenticated } = useAuth();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  const handleOpenAuth = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setIsAuthModalVisible(true);
    }
  };

  const cloudLabel = isAuthenticated
    ? isMobile
      ? `🟢 ${user?.email?.split("@")[0] ?? "Cloud"}`
      : `🟢 ${user?.email ?? "Cloud connecté"}`
    : isMobile
    ? "☁️ Local"
    : "☁️ Mode Local (Connexion)";

  return (
    <>
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
          </Pressable>
        </View>

        {/* Contextual Action Buttons & Cloud Badge */}
        <View style={styles.actionsRow}>
          {/* Cloud Auth Status Badge */}
          <Pressable
            style={[
              styles.cloudBadge,
              isAuthenticated
                ? styles.cloudBadgeConnected
                : styles.cloudBadgeLocal,
              cursorPointer,
            ]}
            onPress={handleOpenAuth}
            accessibilityRole="button"
            accessibilityLabel="Statut de connexion Cloud"
          >
            <Text
              style={[
                styles.cloudBadgeText,
                isAuthenticated && styles.cloudBadgeTextConnected,
              ]}
              numberOfLines={1}
            >
              {cloudLabel}
            </Text>
          </Pressable>

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

      {/* Modal d'authentification et de synchronisation */}
      <AuthModal
        visible={isAuthModalVisible}
        onClose={() => setIsAuthModalVisible(false)}
      />
    </>
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
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(20px)" } as unknown as ViewStyle)
      : {}),
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
  cloudBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cloudBadgeLocal: {
    backgroundColor: "rgba(15, 41, 34, 0.04)",
    borderColor: "rgba(15, 41, 34, 0.12)",
  },
  cloudBadgeConnected: {
    backgroundColor: colors.positiveSoft,
    borderColor: "rgba(5, 150, 105, 0.25)",
  },
  cloudBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    maxWidth: 160,
  },
  cloudBadgeTextConnected: {
    color: colors.primary,
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
