import { credentialsSchema } from "../types/validation";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { pullSupabaseToLocal, pushLocalToSupabase } from "../services/syncService";
import { isSupabaseConfigured } from "../config/supabase";
import { colors, shadows } from "../theme/colors";
import { cursorPointer } from "../theme/webCursor";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

export function AuthModal({ visible, onClose, onAuthSuccess }: AuthModalProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    signIn,
    signUp,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFeedbackError(null);
    setFeedbackSuccess(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const cleanEmail = email.trim();
    if (!credentialsSchema.safeParse({ email: cleanEmail, password }).success) {
      setFeedbackError("Saisissez une adresse email valide et un mot de passe de 6 caractères minimum.");
      return;
    }
    if (!cleanEmail || !password) {
      setFeedbackError("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setFeedbackError("Veuillez saisir une adresse email valide.");
      return;
    }

    if (password.length < 6) {
      setFeedbackError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (mode === "signUp" && password !== confirmPassword) {
      setFeedbackError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    if (mode === "signIn") {
      const result = await signIn(cleanEmail, password);
      setIsSubmitting(false);

      if (!result.success) {
        setFeedbackError(result.error || "Échec de connexion.");
      } else {
        setFeedbackSuccess("Connexion réussie ! Vos données sont synchronisées.");
        if (onAuthSuccess) {
          onAuthSuccess();
        }
        setTimeout(() => {
          handleClose();
        }, 1000);
      }
    } else {
      const result = await signUp(cleanEmail, password);
      setIsSubmitting(false);

      if (!result.success) {
        setFeedbackError(result.error || "Échec de l'inscription.");
      } else {
        setFeedbackSuccess(
          "Compte créé avec succès ! Vérifiez votre boîte mail si la confirmation est requise."
        );
        if (onAuthSuccess) {
          onAuthSuccess();
        }
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    }
  };

  const handlePushSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const res = await pushLocalToSupabase(user.id);
    setIsSyncing(false);

    if (res.success) {
      setFeedbackSuccess("Données sauvegardées sur le Cloud avec succès !");
    } else {
      setFeedbackError(res.error || "Erreur de synchronisation montante.");
    }
  };

  const handlePullSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const res = await pullSupabaseToLocal(user.id);
    setIsSyncing(false);

    if (res.success) {
      setFeedbackSuccess("Données restaurées depuis le Cloud avec succès !");
    } else {
      setFeedbackError(res.error || "Erreur de synchronisation descendante.");
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOut();
    setIsSubmitting(false);
    resetForm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={handleClose}>
          <Pressable
            style={[styles.modalCard, isMobile && styles.modalCardMobile]}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardContent}
            >
              {/* Header de la Modal */}
              <View style={styles.headerRow}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>☁️</Text>
                </View>
                <View style={styles.headerTexts}>
                  <Text style={styles.title}>
                    {isAuthenticated ? "Espace Cloud Synchronisé" : "Compte Cloud NovaBudget"}
                  </Text>
                  <Text style={styles.subtitle}>
                    {isAuthenticated
                      ? "Vos finances sécurisées et synchronisées en temps réel."
                      : "Sauvegardez vos comptes et prévisions sur tous vos appareils."}
                  </Text>
                </View>
                <Pressable
                  style={[styles.closeButton, cursorPointer]}
                  onPress={handleClose}
                  hitSlop={10}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              {!isSupabaseConfigured && (
                <View style={styles.unconfiguredBanner}>
                  <Text style={styles.unconfiguredTitle}>
                    ⚠️ Configuration Supabase Requise
                  </Text>
                  <Text style={styles.unconfiguredText}>
                    Veuillez renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans votre fichier .env. Un compte Supabase est obligatoire pour synchroniser vos données.
                  </Text>
                </View>
              )}

              {/* Feedback Alert Banners */}
              {feedbackError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{feedbackError}</Text>
                </View>
              )}

              {feedbackSuccess && (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>{feedbackSuccess}</Text>
                </View>
              )}

              {/* Contenu conditionnel selon connexion */}
              {isAuthenticated && user ? (
                /* ÉTAT CONNECTÉ */
                <View style={styles.authenticatedSection}>
                  <View style={styles.userProfileCard}>
                    <View style={styles.profileBadge}>
                      <Text style={styles.profileBadgeText}>🟢 Connecté</Text>
                    </View>
                    <Text style={styles.userEmailLabel}>Compte actif :</Text>
                    <Text style={styles.userEmailValue}>{user.email}</Text>
                    <Text style={styles.userIdValue}>ID: {user.id.slice(0, 8)}...</Text>
                  </View>

                  <View style={styles.syncActionsBlock}>
                    <Text style={styles.sectionMiniTitle}>Synchronisation</Text>
                    <View style={styles.syncButtonsRow}>
                      <Pressable
                        style={[
                          styles.syncBtn,
                          styles.syncBtnPrimary,
                          cursorPointer,
                          isSyncing && styles.btnDisabled,
                        ]}
                        onPress={handlePushSync}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.syncBtnPrimaryText}>
                            ⬆️ Sauvegarder (Push)
                          </Text>
                        )}
                      </Pressable>

                      <Pressable
                        style={[
                          styles.syncBtn,
                          styles.syncBtnSecondary,
                          cursorPointer,
                          isSyncing && styles.btnDisabled,
                        ]}
                        onPress={handlePullSync}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Text style={styles.syncBtnSecondaryText}>
                            ⬇️ Restaurer (Pull)
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.bottomButtonsRow}>
                    <Pressable
                      style={[styles.signOutBtn, cursorPointer]}
                      onPress={handleSignOut}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <Text style={styles.signOutBtnText}>Se déconnecter</Text>
                      )}
                    </Pressable>

                    <Pressable
                      style={[styles.doneBtn, cursorPointer]}
                      onPress={handleClose}
                    >
                      <Text style={styles.doneBtnText}>Fermer</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                /* ÉTAT NON CONNECTÉ / FORMULAIRE */
                <View style={styles.formSection}>
                  {/* Switch Connexion / Inscription */}
                  <View style={styles.modeTabs}>
                    <Pressable
                      style={[
                        styles.modeTab,
                        cursorPointer,
                        mode === "signIn" && styles.modeTabActive,
                      ]}
                      onPress={() => {
                        setMode("signIn");
                        setFeedbackError(null);
                        setFeedbackSuccess(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.modeTabText,
                          mode === "signIn" && styles.modeTabTextActive,
                        ]}
                      >
                        Connexion
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.modeTab,
                        cursorPointer,
                        mode === "signUp" && styles.modeTabActive,
                      ]}
                      onPress={() => {
                        setMode("signUp");
                        setFeedbackError(null);
                        setFeedbackSuccess(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.modeTabText,
                          mode === "signUp" && styles.modeTabTextActive,
                        ]}
                      >
                        Créer un compte
                      </Text>
                    </Pressable>
                  </View>

                  {/* Champ Email */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Adresse Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="nom@exemple.com"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Champ Mot de passe */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mot de passe</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Confirmation Mot de passe en mode SignUp */}
                  {mode === "signUp" && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textMuted}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  )}

                  {/* Bouton de Soumission Principal */}
                  <Pressable
                    style={[
                      styles.submitBtn,
                      cursorPointer,
                      (isSubmitting || isAuthLoading) && styles.btnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting || isAuthLoading}
                  >
                    {isSubmitting || isAuthLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        {mode === "signIn" ? "Se connecter" : "Créer mon compte"}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 41, 34, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  backdropPressable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "90%",
    ...shadows.lg,
    overflow: "hidden",
  },
  modalCardMobile: {
    maxWidth: "100%",
    borderRadius: 20,
  },
  cardContent: {
    padding: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 22,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  unconfiguredBanner: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.3)",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  unconfiguredTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.warning,
  },
  unconfiguredText: {
    fontSize: 11,
    color: "#78350F",
    lineHeight: 16,
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.25)",
    borderRadius: 12,
    padding: 10,
  },
  errorBannerText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "600",
  },
  successBanner: {
    backgroundColor: colors.positiveSoft,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.25)",
    borderRadius: 12,
    padding: 10,
  },
  successBannerText: {
    fontSize: 12,
    color: colors.positive,
    fontWeight: "600",
  },
  formSection: {
    gap: 14,
  },
  modeTabs: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    padding: 4,
    borderRadius: 14,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: "#FFFFFF",
    ...shadows.sm,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.primaryBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: "#0D9488",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    ...shadows.sm,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.65,
  },
  authenticatedSection: {
    gap: 16,
  },
  userProfileCard: {
    backgroundColor: colors.primaryBackground,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  profileBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.positiveSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.positive,
  },
  userEmailLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  userEmailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.brand,
  },
  userIdValue: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionMiniTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  syncActionsBlock: {
    gap: 8,
  },
  syncButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  syncBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  syncBtnPrimary: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  syncBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  syncBtnSecondary: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  syncBtnSecondaryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  signOutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  signOutBtnText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  doneBtn: {
    backgroundColor: "rgba(15, 41, 34, 0.06)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  doneBtnText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
});
