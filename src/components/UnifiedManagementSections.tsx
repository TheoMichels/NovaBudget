import { moneySchema, parseFrenchNumber } from "../types/validation";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { colors, shadows } from "../theme/colors";
import { cursorPointer } from "../theme/webCursor";
import { SavingsAccount } from "../types/savingsAccount";
import { Expense, ExpenseCategory } from "../types/expense";
import { OneOffInflow } from "../types/projection";
import { formatEuro } from "../hooks/useForecast";
import { formatFrenchMonthYear } from "../utils/dateUtils";
import { MonthYearCalendar } from "./MonthYearCalendar";

export interface UnifiedManagementSectionsProps {
  // Épargnes
  accounts: SavingsAccount[];
  onOpenAddSavings: () => void;
  onUpdateAccountAmount: (id: string, amount: number) => void;
  onRemoveAccount: (id: string) => void;
  // Sous mis de côté par mois
  monthlySavings: number;
  onUpdateMonthlySavings: (amount: number) => void;
  // Seuil de sécurité (coussin de précaution)
  safetyCushionTarget?: number;
  onUpdateSafetyCushion?: (newTarget: number) => void;
  // Dépenses prévues
  expenses: Expense[];
  onOpenAddExpense: () => void;
  onToggleExpenseActive: (id: string) => void;
  onRemoveExpense: (id: string) => void;
  onUpdateExpenseDate: (id: string, targetDate: string) => void;
  // Rentrées prévues
  inflows: OneOffInflow[];
  onOpenAddInflow: () => void;
  onToggleInflowActive: (id: string) => void;
  onRemoveInflow: (id: string) => void;
  onUpdateInflowDate?: (id: string, targetDate: string) => void;
}

const DEFAULT_SAFETY_CUSHION = 20000;

const EXPENSE_CATEGORY_SHORT_LABELS: Record<ExpenseCategory, string> = {
  voyage: "Voyage",
  logement: "Logement",
  vehicule: "Véhicule",
  famille: "Famille",
  fiscalite: "Impôts",
  autre: "Autre",
};

export function UnifiedManagementSections({
  accounts,
  onOpenAddSavings,
  onUpdateAccountAmount,
  onRemoveAccount,
  monthlySavings,
  onUpdateMonthlySavings,
  safetyCushionTarget = DEFAULT_SAFETY_CUSHION,
  onUpdateSafetyCushion,
  expenses,
  onOpenAddExpense,
  onToggleExpenseActive,
  onRemoveExpense,
  onUpdateExpenseDate,
  inflows,
  onOpenAddInflow,
  onToggleInflowActive,
  onRemoveInflow,
  onUpdateInflowDate,
}: UnifiedManagementSectionsProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;
  const isMobile = width < 600;
  const isNarrow = width < 420;

  const [actionError, setActionError] = useState<string | null>(null);
  const runAction = async (action: () => unknown) => {
    try { setActionError(null); await action(); } catch (e) {
      setActionError(e instanceof Error ? e.message : "Enregistrement impossible. Réessayez.");
    }
  };

  // Inline edit state for savings account amount
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editAccountAmountStr, setEditAccountAmountStr] = useState<string>("");

  // Inline edit state for monthly savings
  const [isEditingMonthlySavings, setIsEditingMonthlySavings] = useState(false);
  const [editMonthlySavingsStr, setEditMonthlySavingsStr] = useState<string>("");

  // Direct input state for safety cushion target
  const [safetyCushionInputText, setSafetyCushionInputText] = useState<string>(
    String(safetyCushionTarget)
  );
  const [isSafetyCushionFocused, setIsSafetyCushionFocused] = useState<boolean>(false);

  // Synchronize input text with prop when safetyCushionTarget changes externally and input is not focused
  useEffect(() => {
    if (!isSafetyCushionFocused) {
      setSafetyCushionInputText(String(safetyCushionTarget));
    }
  }, [safetyCushionTarget, isSafetyCushionFocused]);

  // Date picker modal state for expenses
  const [editingExpenseForDate, setEditingExpenseForDate] = useState<Expense | null>(null);
  const [tempExpenseDate, setTempExpenseDate] = useState<string>("");

  // Date picker modal state for inflows
  const [editingInflowForDate, setEditingInflowForDate] = useState<OneOffInflow | null>(null);
  const [tempInflowDate, setTempInflowDate] = useState<string>("");

  // Calculated totals
  const totalSavings = accounts.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const activeExpenses = expenses.filter((e) => e.isActive);
  const totalActiveExpenses = activeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const activeInflows = inflows.filter((i) => i.isActive);
  const totalActiveInflows = activeInflows.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Handlers for savings account inline edit
  const handleStartEditAccount = (acc: SavingsAccount) => {
    setEditingAccountId(acc.id);
    setEditAccountAmountStr(String(acc.amount));
  };

  const handleCancelEditAccount = () => {
    setEditingAccountId(null);
    setEditAccountAmountStr("");
  };

  const handleConfirmEditAccount = (id: string) => {
    const cleaned = editAccountAmountStr.replace(/\s/g, "").replace(",", ".");
    const parsed = parseFrenchNumber(cleaned);
    if (!moneySchema.safeParse(parsed).success) { setActionError("Montant invalide. Saisissez un nombre positif ou nul."); return; }
    if (!isNaN(parsed) && parsed >= 0) {
      void runAction(() => onUpdateAccountAmount(id, parsed));
    }
    setEditingAccountId(null);
    setEditAccountAmountStr("");
  };

  // Handlers for monthly savings inline edit
  const handleStartEditMonthly = () => {
    setIsEditingMonthlySavings(true);
    setEditMonthlySavingsStr(String(monthlySavings));
  };

  const handleCancelEditMonthly = () => {
    setIsEditingMonthlySavings(false);
    setEditMonthlySavingsStr("");
  };

  const handleConfirmEditMonthly = () => {
    const cleaned = editMonthlySavingsStr.replace(/\s/g, "").replace(",", ".");
    const parsed = parseFrenchNumber(cleaned);
    if (!moneySchema.safeParse(parsed).success) { setActionError("Montant invalide. Saisissez un nombre positif ou nul."); return; }
    if (!isNaN(parsed) && parsed >= 0) {
      void runAction(() => onUpdateMonthlySavings(Math.round(parsed)));
    }
    setIsEditingMonthlySavings(false);
    setEditMonthlySavingsStr("");
  };

  const handleApplyStepper = (delta: number) => {
    const nextVal = Math.max(0, monthlySavings + delta);
    void runAction(() => onUpdateMonthlySavings(nextVal));
  };

  // Handlers for direct safety cushion input
  const handleSafetyCushionChangeText = (text: string) => {
    setSafetyCushionInputText(text);
    const parsed = parseFrenchNumber(text);
    if (moneySchema.safeParse(parsed).success) {
      onUpdateSafetyCushion?.(parsed);
    }
  };

  const handleSafetyCushionBlur = () => {
    setIsSafetyCushionFocused(false);
    const parsed = parseFrenchNumber(safetyCushionInputText);
    if (!moneySchema.safeParse(parsed).success) {
      setActionError("Seuil invalide. Saisissez un nombre positif ou nul.");
      setSafetyCushionInputText(String(safetyCushionTarget));
      return;
    }
    setActionError(null);
    setSafetyCushionInputText(String(parsed));
    onUpdateSafetyCushion?.(parsed);
  };

  // Handlers for expense date editing
  const handleOpenExpenseDateModal = (exp: Expense) => {
    setEditingExpenseForDate(exp);
    setTempExpenseDate(exp.targetDate);
  };

  const handleConfirmExpenseDate = () => {
    if (editingExpenseForDate && tempExpenseDate) {
      void runAction(() => onUpdateExpenseDate(editingExpenseForDate.id, tempExpenseDate));
    }
    setEditingExpenseForDate(null);
  };

  // Handlers for inflow date editing
  const handleOpenInflowDateModal = (inf: OneOffInflow) => {
    if (!onUpdateInflowDate) return;
    setEditingInflowForDate(inf);
    setTempInflowDate(inf.targetDate);
  };

  const handleConfirmInflowDate = () => {
    if (editingInflowForDate && tempInflowDate && onUpdateInflowDate) {
      void runAction(() => onUpdateInflowDate(editingInflowForDate.id, tempInflowDate));
    }
    setEditingInflowForDate(null);
  };

  /* ------------------------------------------------------------- */
  /* BLOCK A: Mes Épargnes                                         */
  /* ------------------------------------------------------------- */
  const renderSavingsBlock = (): React.JSX.Element => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderTitleGroup}>
          <Text style={styles.cardHeaderTitle}>Mes Épargnes</Text>
          <View style={styles.badgeEmerald}>
            <Text style={styles.badgeEmeraldText}>
              {accounts.length} · {formatEuro(totalSavings)}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.btnPrimaryEmerald, cursorPointer]}
          onPress={onOpenAddSavings}
          accessibilityLabel="Ajouter un compte d'épargne"
        >
          <Text style={styles.btnPrimaryEmeraldText}>
            {isMobile ? "+ Ajouter" : "+ Ajouter un compte"}
          </Text>
        </Pressable>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>Aucun compte d'épargne configuré.</Text>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {accounts.map((acc) => {
            const isEditing = editingAccountId === acc.id;
            const initials = (acc.bank || acc.name).trim().substring(0, 2).toUpperCase();

            return (
              <View key={acc.id} style={styles.itemRow}>
                {/* Left: Avatar + Title & Rate */}
                <View style={styles.itemRowLeft}>
                  <View style={styles.avatarPill}>
                    <Text style={styles.avatarPillText}>{initials}</Text>
                  </View>

                  <View style={styles.accountInfoCol}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {acc.name}
                    </Text>
                    <View style={styles.rateTag}>
                      <Text style={styles.rateTagText}>Taux : {acc.rate}%</Text>
                    </View>
                  </View>
                </View>

                {/* Right: Inline edit or Amount + Actions */}
                <View style={styles.itemRowRight}>
                  {isEditing ? (
                    <View style={styles.inlineEditGroup}>
                      <TextInput
                        style={styles.inlineInput}
                        value={editAccountAmountStr}
                        onChangeText={setEditAccountAmountStr}
                        keyboardType="decimal-pad"
                        autoFocus
                        selectTextOnFocus
                        onSubmitEditing={() => handleConfirmEditAccount(acc.id)}
                      />
                      <Pressable
                        style={[styles.inlineActionBtn, styles.inlineSaveBtn, cursorPointer]}
                        onPress={() => handleConfirmEditAccount(acc.id)}
                        hitSlop={6}
                      >
                        <Text style={styles.inlineSaveBtnText}>✓</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.inlineActionBtn, styles.inlineCancelBtn, cursorPointer]}
                        onPress={handleCancelEditAccount}
                        hitSlop={6}
                      >
                        <Text style={styles.inlineCancelBtnText}>✕</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.amountActionsRow}>
                      <Pressable
                        style={[styles.amountPressable, cursorPointer]}
                        onPress={() => handleStartEditAccount(acc)}
                        hitSlop={4}
                      >
                        <Text style={styles.amountTextPrimary} numberOfLines={1}>
                          {formatEuro(acc.amount)}
                        </Text>
                        <Text style={styles.pencilIcon}>✎</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.btnDelete, cursorPointer]}
                        onPress={() => { void runAction(() => onRemoveAccount(acc.id)); }}
                        hitSlop={8}
                        accessibilityLabel={`Supprimer ${acc.name}`}
                      >
                        <Text style={styles.btnDeleteText}>✕</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  /* ------------------------------------------------------------- */
  /* BLOCK B: Sous de côté par mois                                */
  /* ------------------------------------------------------------- */
  const renderMonthlySavingsBlock = (): React.JSX.Element => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderTitleGroup}>
          <Text style={styles.cardHeaderTitle}>Sous de côté par mois</Text>
          <View style={styles.badgeNeutral}>
            <Text style={styles.badgeNeutralText}>Récurrent</Text>
          </View>
        </View>

        {monthlySavings > 0 && (
          <Text style={styles.annualEstimateText}>
            {formatEuro(monthlySavings * 12)} / an
          </Text>
        )}
      </View>

      {/* Main Monthly Display Box with Steppers */}
      <View style={styles.monthlyDisplayBox}>
        {isEditingMonthlySavings ? (
          <View style={styles.inlineEditGroup}>
            <TextInput
              style={[styles.inlineInput, styles.inlineInputLarge]}
              value={editMonthlySavingsStr}
              onChangeText={setEditMonthlySavingsStr}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              onSubmitEditing={handleConfirmEditMonthly}
            />
            <Pressable
              style={[styles.inlineActionBtn, styles.inlineSaveBtn, cursorPointer]}
              onPress={handleConfirmEditMonthly}
              hitSlop={6}
            >
              <Text style={styles.inlineSaveBtnText}>✓</Text>
            </Pressable>
            <Pressable
              style={[styles.inlineActionBtn, styles.inlineCancelBtn, cursorPointer]}
              onPress={handleCancelEditMonthly}
              hitSlop={6}
            >
              <Text style={styles.inlineCancelBtnText}>✕</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.monthlyHeroAmountGroup, cursorPointer]}
            onPress={handleStartEditMonthly}
            hitSlop={6}
          >
            <Text style={styles.monthlyHeroAmount} numberOfLines={1} adjustsFontSizeToFit>
              {formatEuro(monthlySavings)}
            </Text>
            <Text style={styles.monthlyHeroUnit}>/ mois</Text>
            <Text style={styles.pencilIcon}>✎</Text>
          </Pressable>
        )}

        {/* Stepper Buttons Row */}
        <View style={styles.steppersRow}>
          <Pressable
            style={[styles.stepperButton, cursorPointer]}
            onPress={() => handleApplyStepper(-100)}
            accessibilityLabel="Diminuer de 100€"
          >
            <Text style={styles.stepperButtonText}>-100 €</Text>
          </Pressable>

          <Pressable
            style={[styles.stepperButton, cursorPointer]}
            onPress={() => handleApplyStepper(-50)}
            accessibilityLabel="Diminuer de 50€"
          >
            <Text style={styles.stepperButtonText}>-50 €</Text>
          </Pressable>

          <Pressable
            style={[styles.stepperButton, cursorPointer]}
            onPress={() => handleApplyStepper(+50)}
            accessibilityLabel="Augmenter de 50€"
          >
            <Text style={styles.stepperButtonText}>+50 €</Text>
          </Pressable>

          <Pressable
            style={[styles.stepperButton, cursorPointer]}
            onPress={() => handleApplyStepper(+100)}
            accessibilityLabel="Augmenter de 100€"
          >
            <Text style={styles.stepperButtonText}>+100 €</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  /* ------------------------------------------------------------- */
  /* BLOCK: Seuil de sécurité (Coussin de précaution)              */
  /* ------------------------------------------------------------- */
  const renderSafetyCushionBlock = (): React.JSX.Element => {
    const isCovered = totalSavings >= safetyCushionTarget;

    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderTitleGroup}>
            <Text style={styles.cardHeaderTitle}>Seuil de sécurité</Text>
            <View style={styles.badgeShield}>
              <Text style={styles.badgeShieldText}>🛡️ Coussin</Text>
            </View>
          </View>

          <View
            style={[
              styles.cushionStatusBadge,
              isCovered ? styles.cushionStatusBadgeCovered : styles.cushionStatusBadgeUncovered,
            ]}
          >
            <Text
              style={[
                styles.cushionStatusBadgeText,
                isCovered ? styles.cushionStatusBadgeTextCovered : styles.cushionStatusBadgeTextUncovered,
              ]}
            >
              {isCovered ? "✓ Protégé" : "⚠️ À consolider"}
            </Text>
          </View>
        </View>

        <Text style={styles.cushionSubtitle}>
          Coussin de sécurité pour parer aux imprévus
        </Text>

        {/* Direct Editable Input Card */}
        <View style={styles.cushionDisplayBox}>
          <View
            style={[
              styles.cushionInputContainer,
              isSafetyCushionFocused && styles.cushionInputContainerFocused,
            ]}
          >
            <TextInput
              style={styles.cushionTextInput}
              value={safetyCushionInputText}
              onChangeText={handleSafetyCushionChangeText}
              onFocus={() => setIsSafetyCushionFocused(true)}
              onBlur={handleSafetyCushionBlur}
              onSubmitEditing={handleSafetyCushionBlur}
              keyboardType="number-pad"
              placeholder={String(DEFAULT_SAFETY_CUSHION)}
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              accessibilityLabel="Seuil de sécurité en euros"
            />
            <View style={styles.cushionCurrencyBadge}>
              <Text style={styles.cushionCurrencyBadgeText}>€</Text>
            </View>
          </View>

          <Text style={styles.cushionHelpText}>
            {isCovered
              ? `Vos épargnes actuelles (${formatEuro(totalSavings)}) couvrent votre coussin.`
              : `Il vous manque ${formatEuro(Math.max(0, safetyCushionTarget - totalSavings))} pour atteindre votre objectif.`}
          </Text>
        </View>
      </View>
    );
  };

  /* ------------------------------------------------------------- */
  /* BLOCK C: Dépenses prévues                                     */
  /* ------------------------------------------------------------- */
  const renderExpensesBlock = (): React.JSX.Element => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderTitleGroup}>
          <Text style={styles.cardHeaderTitle}>Dépenses prévues</Text>
          <View style={styles.badgeWarning}>
            <Text style={styles.badgeWarningText}>
              {activeExpenses.length} · -{formatEuro(totalActiveExpenses)}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.btnPrimaryAmber, cursorPointer]}
          onPress={onOpenAddExpense}
          accessibilityLabel="Planifier une dépense"
        >
          <Text style={styles.btnPrimaryAmberText}>
            {isMobile ? "+ Planifier" : "+ Planifier une dépense"}
          </Text>
        </Pressable>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>Aucune dépense planifiée.</Text>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {expenses.map((exp) => {
            const shortCat = EXPENSE_CATEGORY_SHORT_LABELS[exp.category] || "Dépense";
            const dateStr = formatFrenchMonthYear(exp.targetDate, "short");

            return (
              <View
                key={exp.id}
                style={[styles.itemRow, !exp.isActive && styles.itemRowInactive]}
              >
                {/* Left: Checkbox + Title + Badges */}
                <View style={styles.itemRowLeft}>
                  <Pressable
                    style={[
                      styles.checkboxBox,
                      exp.isActive && styles.checkboxBoxActiveAmber,
                      cursorPointer,
                    ]}
                    onPress={() => { void runAction(() => onToggleExpenseActive(exp.id)); }}
                    hitSlop={8}
                    accessibilityLabel={exp.isActive ? "Désactiver le projet" : "Activer le projet"}
                  >
                    {exp.isActive && <Text style={styles.checkmarkIcon}>✓</Text>}
                  </Pressable>

                  <View style={styles.expenseInfoCol}>
                    <Text
                      style={[
                        styles.itemTitle,
                        !exp.isActive && styles.itemTitleInactive,
                      ]}
                      numberOfLines={1}
                    >
                      {exp.title}
                    </Text>

                    <View style={styles.metaBadgesRow}>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{shortCat}</Text>
                      </View>

                      <Pressable
                        style={[styles.dateChip, cursorPointer]}
                        onPress={() => handleOpenExpenseDateModal(exp)}
                        hitSlop={4}
                        accessibilityLabel={`Modifier la date de ${exp.title}`}
                      >
                        <Text style={styles.dateChipText}>📅 {dateStr}</Text>
                        <Text style={styles.datePencilIcon}>✎</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Right: Amount + Delete Button */}
                <View style={styles.itemRowRight}>
                  <Text
                    style={[
                      styles.amountTextAmber,
                      !exp.isActive && styles.amountTextInactive,
                      isNarrow && styles.amountTextCompact,
                    ]}
                    numberOfLines={1}
                  >
                    -{formatEuro(exp.amount)}
                  </Text>

                  <Pressable
                    style={[styles.btnDelete, cursorPointer]}
                    onPress={() => { void runAction(() => onRemoveExpense(exp.id)); }}
                    hitSlop={8}
                    accessibilityLabel={`Supprimer ${exp.title}`}
                  >
                    <Text style={styles.btnDeleteText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  /* ------------------------------------------------------------- */
  /* BLOCK D: Rentrées d'argent prévues                            */
  /* ------------------------------------------------------------- */
  const renderInflowsBlock = (): React.JSX.Element => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderTitleGroup}>
          <Text style={styles.cardHeaderTitle}>Rentrées d'argent prévues</Text>
          <View style={styles.badgeInflow}>
            <Text style={styles.badgeInflowText}>
              {activeInflows.length} · +{formatEuro(totalActiveInflows)}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.btnPrimaryInflow, cursorPointer]}
          onPress={onOpenAddInflow}
          accessibilityLabel="Ajouter une rentrée financière"
        >
          <Text style={styles.btnPrimaryInflowText}>
            {isMobile ? "+ Rentrée" : "+ Ajouter une rentrée"}
          </Text>
        </Pressable>
      </View>

      {inflows.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardText}>Aucune rentrée d'argent enregistrée.</Text>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {inflows.map((inf) => {
            const dateStr = formatFrenchMonthYear(inf.targetDate, "short");

            return (
              <View
                key={inf.id}
                style={[styles.itemRow, !inf.isActive && styles.itemRowInactive]}
              >
                {/* Left: Checkbox + Title + Date */}
                <View style={styles.itemRowLeft}>
                  <Pressable
                    style={[
                      styles.checkboxBox,
                      inf.isActive && styles.checkboxBoxActiveInflow,
                      cursorPointer,
                    ]}
                    onPress={() => { void runAction(() => onToggleInflowActive(inf.id)); }}
                    hitSlop={8}
                    accessibilityLabel={inf.isActive ? "Désactiver la rentrée" : "Activer la rentrée"}
                  >
                    {inf.isActive && <Text style={styles.checkmarkIcon}>✓</Text>}
                  </Pressable>

                  <View style={styles.expenseInfoCol}>
                    <Text
                      style={[
                        styles.itemTitle,
                        !inf.isActive && styles.itemTitleInactive,
                      ]}
                      numberOfLines={1}
                    >
                      {inf.title}
                    </Text>

                    <View style={styles.metaBadgesRow}>
                      <Pressable
                        style={[
                          styles.dateChip,
                          onUpdateInflowDate && cursorPointer,
                        ]}
                        onPress={() => handleOpenInflowDateModal(inf)}
                        hitSlop={4}
                        disabled={!onUpdateInflowDate}
                        accessibilityLabel={`Date de ${inf.title}`}
                      >
                        <Text style={styles.dateChipText}>📅 {dateStr}</Text>
                        {onUpdateInflowDate && <Text style={styles.datePencilIcon}>✎</Text>}
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Right: Amount + Delete Button */}
                <View style={styles.itemRowRight}>
                  <Text
                    style={[
                      styles.amountTextInflow,
                      !inf.isActive && styles.amountTextInactive,
                      isNarrow && styles.amountTextCompact,
                    ]}
                    numberOfLines={1}
                  >
                    +{formatEuro(inf.amount)}
                  </Text>

                  <Pressable
                    style={[styles.btnDelete, cursorPointer]}
                    onPress={() => { void runAction(() => onRemoveInflow(inf.id)); }}
                    hitSlop={8}
                    accessibilityLabel={`Supprimer ${inf.title}`}
                  >
                    <Text style={styles.btnDeleteText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <View testID="management-sections" style={styles.rootWrapper}>
      {actionError && <Text testID="management-error" accessibilityRole="alert" style={{ color: colors.danger }}>{actionError}</Text>}
      {/* Structural layout: 2 columns on Desktop, vertically stacked on Mobile */}
      {isDesktop ? (
        <View style={[styles.mainLayout, styles.layoutRow]}>
          {/* Colonne 1: Épargnes (1) + Dépenses prévues (2) */}
          <View style={[styles.columnGroup, styles.columnGroupDesktop]}>
            {renderSavingsBlock()}
            {renderExpensesBlock()}
          </View>

          {/* Colonne 2: Rentrées d'argent (3) + Sous de côté (4) + Seuil de sécurité (5) */}
          <View style={[styles.columnGroup, styles.columnGroupDesktop]}>
            {renderInflowsBlock()}
            {renderMonthlySavingsBlock()}
            {renderSafetyCushionBlock()}
          </View>
        </View>
      ) : (
        <View style={[styles.mainLayout, styles.layoutStack]}>
          {/* Ordre strict Mobile: 1 -> 2 -> 3 -> 4 -> 5 */}
          {renderSavingsBlock()}
          {renderExpensesBlock()}
          {renderInflowsBlock()}
          {renderMonthlySavingsBlock()}
          {renderSafetyCushionBlock()}
        </View>
      )}

      {/* Date Picker Modal for Expense */}
      {editingExpenseForDate && (
        <Modal
          visible={!!editingExpenseForDate}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingExpenseForDate(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalTitle}>Modifier l'échéance</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {editingExpenseForDate.title}
                  </Text>
                </View>
                <Pressable
                  style={[styles.modalCloseBtn, cursorPointer]}
                  onPress={() => setEditingExpenseForDate(null)}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </Pressable>
              </View>

              <MonthYearCalendar
                value={tempExpenseDate}
                onChange={setTempExpenseDate}
                accentColor={colors.warning}
              />

              <View style={styles.modalActionsRow}>
                <Pressable
                  style={[styles.modalCancelBtn, cursorPointer]}
                  onPress={() => setEditingExpenseForDate(null)}
                >
                  <Text style={styles.modalCancelBtnText}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirmBtn, styles.modalConfirmBtnAmber, cursorPointer]}
                  onPress={handleConfirmExpenseDate}
                >
                  <Text style={styles.modalConfirmBtnText}>Valider</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker Modal for Inflow */}
      {editingInflowForDate && (
        <Modal
          visible={!!editingInflowForDate}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingInflowForDate(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <Text style={styles.modalTitle}>Modifier l'échéance</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {editingInflowForDate.title}
                  </Text>
                </View>
                <Pressable
                  style={[styles.modalCloseBtn, cursorPointer]}
                  onPress={() => setEditingInflowForDate(null)}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </Pressable>
              </View>

              <MonthYearCalendar
                value={tempInflowDate}
                onChange={setTempInflowDate}
                accentColor={colors.inflow}
              />

              <View style={styles.modalActionsRow}>
                <Pressable
                  style={[styles.modalCancelBtn, cursorPointer]}
                  onPress={() => setEditingInflowForDate(null)}
                >
                  <Text style={styles.modalCancelBtnText}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirmBtn, styles.modalConfirmBtnInflow, cursorPointer]}
                  onPress={handleConfirmInflowDate}
                >
                  <Text style={styles.modalConfirmBtnText}>Valider</Text>
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
  rootWrapper: {
    width: "100%",
  },
  mainLayout: {
    width: "100%",
  },
  layoutRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  layoutStack: {
    flexDirection: "column",
    gap: 16,
  },
  columnGroup: {
    flex: 1,
    flexDirection: "column",
    gap: 16,
    minWidth: 0,
  },
  columnGroupDesktop: {
    flex: 1,
  },

  /* Card Base Styles */
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 10,
  },
  cardHeaderTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },

  /* Badges */
  badgeEmerald: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeEmeraldText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  badgeNeutral: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeNeutralText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  badgeWarning: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeWarningText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.warning,
  },
  badgeInflow: {
    backgroundColor: colors.inflowSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeInflowText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inflow,
  },

  /* Action Buttons in Header */
  btnPrimaryEmerald: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  btnPrimaryEmeraldText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  btnPrimaryAmber: {
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  btnPrimaryAmberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  btnPrimaryInflow: {
    backgroundColor: colors.inflow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  btnPrimaryInflowText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Empty State */
  emptyCard: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCardText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  /* Item List */
  itemsList: {
    flexDirection: "column",
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAF9",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.6)",
    gap: 8,
  },
  itemRowInactive: {
    backgroundColor: "#F8FAFC",
    opacity: 0.65,
  },
  itemRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  itemRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  /* Avatar & Info */
  avatarPill: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },
  accountInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  expenseInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  itemTitleInactive: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  rateTag: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  rateTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  metaBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 3,
  },
  catBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  dateChipText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  datePencilIcon: {
    fontSize: 9,
    color: colors.textMuted,
  },

  /* Checkbox */
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxActiveAmber: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  checkboxBoxActiveInflow: {
    backgroundColor: colors.inflow,
    borderColor: colors.inflow,
  },
  checkmarkIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },

  /* Amounts & Actions */
  amountActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  amountPressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  amountTextPrimary: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  amountTextAmber: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.warning,
  },
  amountTextInflow: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.inflow,
  },
  amountTextInactive: {
    color: colors.textMuted,
  },
  amountTextCompact: {
    fontSize: 13,
  },
  pencilIcon: {
    fontSize: 11,
    color: colors.textMuted,
  },
  btnDelete: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  btnDeleteText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
  },

  /* Inline Editing */
  inlineEditGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inlineInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    minWidth: 70,
    textAlign: "right",
  },
  inlineInputLarge: {
    fontSize: 20,
    minWidth: 100,
    textAlign: "center",
    paddingVertical: 6,
  },
  inlineActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineSaveBtn: {
    backgroundColor: colors.primarySoft,
  },
  inlineSaveBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },
  inlineCancelBtn: {
    backgroundColor: "#F1F5F9",
  },
  inlineCancelBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },

  /* Monthly Block Specific */
  annualEstimateText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  monthlyDisplayBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    gap: 12,
  },
  monthlyHeroAmountGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  monthlyHeroAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  monthlyHeroUnit: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  steppersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    flexWrap: "wrap",
  },
  stepperButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...shadows.sm,
  },
  stepperButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  /* Safety Cushion Section */
  badgeShield: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeShieldText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706",
  },
  cushionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cushionStatusBadgeCovered: {
    backgroundColor: colors.primarySoft,
  },
  cushionStatusBadgeUncovered: {
    backgroundColor: colors.warningSoft,
  },
  cushionStatusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  cushionStatusBadgeTextCovered: {
    color: colors.primary,
  },
  cushionStatusBadgeTextUncovered: {
    color: colors.warning,
  },
  cushionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    marginTop: -4,
  },
  cushionDisplayBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cushionInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    width: "100%",
    maxWidth: 320,
    ...shadows.sm,
  },
  cushionInputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: "#FFFFFF",
  },
  cushionTextInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
    padding: 0,
    textAlign: "right",
    marginRight: 8,
  },
  cushionCurrencyBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cushionCurrencyBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },
  cushionHelpText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalHeaderInfo: {
    flex: 1,
    paddingRight: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "700",
  },
  modalActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalConfirmBtnAmber: {
    backgroundColor: colors.warning,
  },
  modalConfirmBtnInflow: {
    backgroundColor: colors.inflow,
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
