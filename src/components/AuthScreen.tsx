import { credentialsSchema } from "../types/validation";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradient, shadows } from "../theme/colors";
import { cursorPointer } from "../theme/webCursor";
import { useAuth } from "../hooks/useAuth";
import { isSupabaseConfigured } from "../config/supabase";

export function AuthScreen(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { signIn, signUp, isLoading: isAuthLoading } = useAuth();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (newMode: "signIn" | "signUp") => {
    setMode(newMode);
    setFeedbackError(null);
    setFeedbackSuccess(null);
  };

  const handleSubmit = async () => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!isSupabaseConfigured) {
      setFeedbackError(
        "Configuration Supabase requise : veuillez renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans votre fichier .env"
      );
      return;
    }

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
        setFeedbackError(
          result.error || "Échec de connexion. Vérifiez vos identifiants."
        );
      } else {
        setFeedbackSuccess("Connexion réussie ! Chargement de vos données...");
      }
    } else {
      const result = await signUp(cleanEmail, password);
      setIsSubmitting(false);

      if (!result.success) {
        setFeedbackError(
          result.error || "Échec de l'inscription. Veuillez réessayer."
        );
      } else {
        setFeedbackSuccess(
          "Compte créé avec succès ! Si la confirmation par email est activée, veuillez valider votre boîte de réception."
        );
      }
    }
  };

  const isBusy = isSubmitting || isAuthLoading;

  return (
    <LinearGradient
      colors={gradient.colors}
      locations={gradient.locations}
      start={gradient.start}
      end={gradient.end}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isMobile && styles.cardMobile]}>
            {/* Header Nova : Logo, Titre & Sous-titre */}
            <View style={styles.brandHeader}>
              <View style={styles.logoBadge}>
                <Image
                  source={require("../../assets/logo.png")}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.brandTitle}>Nova</Text>
              <Text style={styles.brandSubtitle}>Épargne & Prévisions</Text>
              <Text style={styles.brandDescription}>
                Espace financier sécurisé et synchronisé. Connectez-vous pour
                accéder à vos comptes et vos prévisions.
              </Text>
            </View>

            {/* Alerte Pédagogique si Supabase non configuré */}
            {!isSupabaseConfigured && (
              <View style={styles.unconfiguredBox}>
                <View style={styles.unconfiguredHeader}>
                  <Text style={styles.unconfiguredIcon}>⚠️</Text>
                  <Text style={styles.unconfiguredTitle}>
                    Configuration Supabase requise
                  </Text>
                </View>
                <Text style={styles.unconfiguredMessage}>
                  Veuillez renseigner{" "}
                  <Text style={styles.codeText}>EXPO_PUBLIC_SUPABASE_URL</Text>{" "}
                  et{" "}
                  <Text style={styles.codeText}>
                    EXPO_PUBLIC_SUPABASE_ANON_KEY
                  </Text>{" "}
                  dans votre fichier <Text style={styles.codeText}>.env</Text>{" "}
                  puis redémarrer le serveur Expo.
                </Text>
              </View>
            )}

            {/* Bannières Feedback Erreur / Succès */}
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

            {/* Onglets Connexion / Inscription */}
            <View style={styles.tabContainer}>
              <Pressable
                style={[
                  styles.tabButton,
                  cursorPointer,
                  mode === "signIn" && styles.tabButtonActive,
                ]}
                onPress={() => handleTabChange("signIn")}
                disabled={isBusy}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    mode === "signIn" && styles.tabButtonTextActive,
                  ]}
                >
                  Connexion
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.tabButton,
                  cursorPointer,
                  mode === "signUp" && styles.tabButtonActive,
                ]}
                onPress={() => handleTabChange("signUp")}
                disabled={isBusy}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    mode === "signUp" && styles.tabButtonTextActive,
                  ]}
                >
                  Créer un compte
                </Text>
              </Pressable>
            </View>

            {/* Formulaire */}
            <View style={styles.formContainer}>
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
                  editable={!isBusy}
                />
              </View>

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
                  editable={!isBusy}
                />
              </View>

              {mode === "signUp" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Confirmer le mot de passe
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isBusy}
                  />
                </View>
              )}

              {/* Bouton de Validation */}
              <Pressable
                style={[
                  styles.submitButton,
                  cursorPointer,
                  isBusy && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === "signIn" ? "Se connecter" : "Créer mon compte"}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Note de sécurité */}
            <View style={styles.securityFooter}>
              <Text style={styles.securityText}>
                🔒 Authentification chiffrée de bout en bout via Supabase
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    gap: 18,
    ...shadows.lg,
  },
  cardMobile: {
    padding: 20,
    borderRadius: 20,
  },
  brandHeader: {
    alignItems: "center",
    gap: 6,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    ...shadows.sm,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 18,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.2,
  },
  brandDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  unconfiguredBox: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.35)",
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  unconfiguredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unconfiguredIcon: {
    fontSize: 16,
  },
  unconfiguredTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.warning,
  },
  unconfiguredMessage: {
    fontSize: 12,
    color: "#78350F",
    lineHeight: 17,
  },
  codeText: {
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#92400E",
  },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.25)",
    borderRadius: 14,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "600",
    textAlign: "center",
  },
  successBanner: {
    backgroundColor: colors.positiveSoft,
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.25)",
    borderRadius: 14,
    padding: 12,
  },
  successBannerText: {
    fontSize: 12,
    color: colors.positive,
    fontWeight: "600",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    padding: 4,
    borderRadius: 14,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    ...shadows.sm,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  formContainer: {
    gap: 14,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  submitButton: {
    backgroundColor: "#0D9488",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    ...shadows.sm,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  securityFooter: {
    alignItems: "center",
    marginTop: 4,
  },
  securityText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
});
