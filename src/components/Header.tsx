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

export interface HeaderProps {
  activeTab?: "current" | "projections";
  onSelectTab?: (tab: "current" | "projections") => void;
  onOpenAddSavings?: () => void;
  onOpenAddExpense?: () => void;
  onOpenAddProject?: () => void;
  onOpenAddInflow?: () => void;
  onOpenAuth?: () => void;
}

export function Header({
  activeTab: _activeTab,
  onSelectTab: _onSelectTab,
  onOpenAddSavings: _onOpenAddSavings,
  onOpenAddExpense: _onOpenAddExpense,
  onOpenAddProject: _onOpenAddProject,
  onOpenAddInflow: _onOpenAddInflow,
  onOpenAuth,
}: HeaderProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isNarrow = width < 400;
  const { user, signOut } = useAuth();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  const handleOpenAuth = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setIsAuthModalVisible(true);
    }
  };

  const userDisplayLabel = user?.email
    ? isNarrow
      ? `🟢 ${user.email.split("@")[0].slice(0, 8)}…`
      : isMobile
      ? `🟢 ${user.email.split("@")[0]}`
      : `🟢 ${user.email}`
    : "🟢 Démo";

  const headerDynamicStyle: ViewStyle = {
    backgroundColor: isMobile ? "#FFFFFF" : colors.panel,
    ...(!isMobile && Platform.OS === "web"
      ? ({ backdropFilter: "blur(20px)" } as unknown as ViewStyle)
      : {}),
  };

  const renderBrand = () => (
    <View style={styles.brandRow}>
      <View style={[styles.logoBadge, isNarrow && styles.logoBadgeNarrow]}>
        <Image
          source={require("../../assets/logo.png")}
          style={[styles.logoImage, isNarrow && styles.logoImageNarrow]}
          resizeMode="cover"
        />
      </View>
      <View style={styles.brandTextCol}>
        <Text
          style={[styles.brandTitle, isNarrow && styles.brandTitleNarrow]}
          numberOfLines={1}
        >
          NovaBudget
        </Text>
        {!isNarrow && (
          <Text style={styles.brandSubtitle} numberOfLines={1}>
            Épargne & Prévisions
          </Text>
        )}
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsRow}>
      {/* Cloud Auth Status Badge */}
      <Pressable
        style={[
          styles.cloudBadge,
          isNarrow && styles.cloudBadgeNarrow,
          cursorPointer,
        ]}
        onPress={handleOpenAuth}
        accessibilityRole="button"
        accessibilityLabel="Gérer mon compte et synchronisation"
      >
        <Text
          style={[
            styles.cloudBadgeText,
            isMobile && (isNarrow ? styles.cloudBadgeTextNarrow : styles.cloudBadgeTextMobile),
          ]}
          numberOfLines={1}
        >
          {userDisplayLabel}
        </Text>
      </Pressable>

      {/* Bouton direct de déconnexion rapide */}
      <Pressable
        style={[styles.btnSignOut, isNarrow && styles.btnSignOutNarrow, cursorPointer]}
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
        {renderBrand()}
        {renderActions()}
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
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
    ...shadows.sm,
  },
  headerMobile: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  brandTextCol: {
    flexShrink: 1,
    justifyContent: "center",
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeNarrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  logoImageNarrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.3,
  },
  brandTitleNarrow: {
    fontSize: 16,
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
    gap: 8,
    flexShrink: 0,
  },
  cloudBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.positiveSoft,
    borderColor: "rgba(5, 150, 105, 0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cloudBadgeNarrow: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  cloudBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    maxWidth: 160,
  },
  cloudBadgeTextMobile: {
    maxWidth: 110,
  },
  cloudBadgeTextNarrow: {
    maxWidth: 84,
    fontSize: 10,
  },
  btnSignOut: {
    backgroundColor: "rgba(220, 38, 38, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.22)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnSignOutNarrow: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  btnSignOutText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "700",
  },
});
