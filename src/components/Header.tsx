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
  onOpenAddSavings?: () => void;
  onOpenAddExpense?: () => void;
  onOpenAddProject?: () => void;
  onOpenAddInflow?: () => void;
  onOpenAuth?: () => void;
}

export function Header({
  activeTab,
  onSelectTab,
  onOpenAddSavings: _onOpenAddSavings,
  onOpenAddExpense: _onOpenAddExpense,
  onOpenAddProject: _onOpenAddProject,
  onOpenAddInflow: _onOpenAddInflow,
  onOpenAuth,
}: HeaderProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { user, signOut } = useAuth();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  const handleOpenAuth = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setIsAuthModalVisible(true);
    }
  };

  const userDisplayLabel = isMobile
    ? `🟢 ${user?.email?.split("@")[0] ?? "Connecté"}`
    : `🟢 ${user?.email ?? "Connecté"}`;

  const headerDynamicStyle: ViewStyle = {
    backgroundColor: isMobile ? "#FFFFFF" : colors.panel,
    ...(!isMobile && Platform.OS === "web"
      ? ({ backdropFilter: "blur(20px)" } as unknown as ViewStyle)
      : {}),
  };

  const renderBrand = () => (
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
  );

  const renderTabs = () => (
    <View style={[styles.tabsRow, isMobile && styles.tabsRowMobile]}>
      <Pressable
        style={[
          styles.tabBtn,
          isMobile && styles.tabBtnMobile,
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
          isMobile && styles.tabBtnMobile,
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
  );

  const renderActions = () => (
    <View style={styles.actionsRow}>
      {/* Cloud Auth Status Badge */}
      <Pressable
        style={[styles.cloudBadge, cursorPointer]}
        onPress={handleOpenAuth}
        accessibilityRole="button"
        accessibilityLabel="Gérer mon compte et synchronisation"
      >
        <Text style={styles.cloudBadgeText} numberOfLines={1}>
          {userDisplayLabel}
        </Text>
      </Pressable>

      {/* Bouton direct de déconnexion rapide */}
      <Pressable
        style={[styles.btnSignOut, cursorPointer]}
        onPress={() => signOut()}
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
      >
        <Text style={styles.btnSignOutText}>
          {isMobile ? "🚪" : "Déconnexion"}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <>
      <View
        style={[
          styles.header,
          headerDynamicStyle,
          isMobile && styles.headerMobile,
        ]}
      >
        {isMobile ? (
          <>
            <View style={styles.mobileTopBar}>
              {renderBrand()}
              {renderActions()}
            </View>
            {renderTabs()}
          </>
        ) : (
          <>
            {renderBrand()}
            {renderTabs()}
            {renderActions()}
          </>
        )}
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
  },
  headerMobile: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  mobileTopBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    backgroundColor: colors.positiveSoft,
    borderColor: "rgba(5, 150, 105, 0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cloudBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    maxWidth: 160,
  },
  btnSignOut: {
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnSignOutText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "700",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    padding: 3,
    borderRadius: 14,
    gap: 3,
  },
  tabsRowMobile: {
    width: "100%",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 11,
    gap: 6,
  },
  tabBtnMobile: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    textAlign: "center",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
  },
});
