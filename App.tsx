import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { gradient } from "./src/theme/colors";
import { useAuth } from "./src/hooks/useAuth";
import { AuthScreen } from "./src/components/AuthScreen";
import { useSavings } from "./src/hooks/useSavings";
import { useExpenses } from "./src/hooks/useExpenses";
import { useProjections } from "./src/hooks/useProjections";
import { useProjectionEngine } from "./src/hooks/useProjectionEngine";
import { useSafetyCushion } from "./src/hooks/useSafetyCushion";
import { Header } from "./src/components/Header";
import { UnifiedKpiCards } from "./src/components/UnifiedKpiCards";
import { UnifiedEvolutionChart } from "./src/components/UnifiedEvolutionChart";
import { UnifiedManagementSections } from "./src/components/UnifiedManagementSections";
import { AddSavingsModal } from "./src/components/AddSavingsModal";
import { AddExpenseModal } from "./src/components/AddExpenseModal";
import { AddInflowModal } from "./src/components/projections/AddInflowModal";
import { formatFrenchMonthYear } from "./src/utils/dateUtils";
import { Expense } from "./src/types/expense";

function AuthenticatedDashboard(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [isAddSavingsVisible, setIsAddSavingsVisible] = useState(false);
  const [isAddExpenseVisible, setIsAddExpenseVisible] = useState(false);
  const [isAddInflowVisible, setIsAddInflowVisible] = useState(false);

  // Position du slider temporel (par défaut 12 mois = 1 an)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(12);

  // Hooks métiers
  const { accounts, addAccount, updateAccount, removeAccount } = useSavings();
  const {
    expenses,
    addExpense,
    toggleExpenseActive,
    removeExpense,
    updateExpense,
  } = useExpenses();
  const {
    projects,
    inflows,
    monthlyConfig,
    addInflow,
    updateInflow,
    toggleInflow,
    removeInflow,
    updateMonthlyTotal,
  } = useProjections();
  const { safetyCushionTarget } = useSafetyCushion();

  // Consolidation des dépenses planifiées (supporte les dépenses et rétro-compatibilité avec les projets futurs)
  const allPlannedExpenses: Expense[] = useMemo(() => {
    const map = new Map<string, Expense>();
    expenses.forEach((e) => map.set(e.id, e));
    projects.forEach((p) => {
      if (!map.has(p.id)) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.targetDate.localeCompare(b.targetDate)
    );
  }, [expenses, projects]);

  // Moteur de projection sur 36 mois (3 ans)
  const forecast = useProjectionEngine(
    accounts,
    allPlannedExpenses,
    inflows,
    monthlyConfig,
    36,
    safetyCushionTarget
  );

  // 1. Épargne actuelle totale disponible
  const totalSavings = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  }, [accounts]);

  // Calcul du mois sélectionné via le slider
  const safeSelectedMonthIndex = Math.min(
    Math.max(0, selectedMonthIndex),
    Math.max(0, forecast.monthlyData.length - 1)
  );
  const selectedPoint = forecast.monthlyData[safeSelectedMonthIndex];
  const selectedDateStr = selectedPoint?.dateStr ?? "";
  const selectedDateLabel = selectedPoint?.dateStr
    ? formatFrenchMonthYear(selectedPoint.dateStr, "short")
    : selectedPoint?.label ?? "Sélection";

  // 2. Dépenses prévues calculées sur base de la date sélectionnée (jusqu'à cette date)
  const activeExpensesUntilDate = useMemo(() => {
    return allPlannedExpenses.filter(
      (e) => e.isActive && (!selectedDateStr || e.targetDate <= selectedDateStr)
    );
  }, [allPlannedExpenses, selectedDateStr]);

  const plannedExpensesUntilDate = useMemo(() => {
    return activeExpensesUntilDate.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );
  }, [activeExpensesUntilDate]);

  const plannedExpensesCount = activeExpensesUntilDate.length;

  // 3. Rentrées d'argent actives calculées sur base de la date sélectionnée (jusqu'à cette date)
  const activeInflowsUntilDate = useMemo(() => {
    return inflows.filter(
      (inf) => inf.isActive && (!selectedDateStr || inf.targetDate <= selectedDateStr)
    );
  }, [inflows, selectedDateStr]);

  const inflowsUntilDate = useMemo(() => {
    return activeInflowsUntilDate.reduce(
      (sum, inf) => sum + (Number(inf.amount) || 0),
      0
    );
  }, [activeInflowsUntilDate]);

  // 4. Intérêts composés cumulés générés par les livrets jusqu'à cette date
  const accumulatedInterestUntilDate = selectedPoint?.accumulatedInterest ?? 0;

  // 5. Épargne projetée exacte (capital du point mensuel sélectionné, incluant épargne, apports, rentrées, dépenses et intérêts)
  const projectedSavings =
    selectedPoint?.capital ?? (totalSavings - plannedExpensesUntilDate);

  return (
    <LinearGradient
      colors={gradient.colors}
      locations={gradient.locations}
      start={gradient.start}
      end={gradient.end}
      style={styles.gradientContainer}
    >
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          {/* Top Bar Navigation (Épurée, sans onglets "Court Terme" / "Projections") */}
          <Header
            onOpenAddSavings={() => setIsAddSavingsVisible(true)}
            onOpenAddExpense={() => setIsAddExpenseVisible(true)}
            onOpenAddInflow={() => setIsAddInflowVisible(true)}
          />

          {/* Tableau de bord principal à défilement */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              isMobile && styles.scrollContentMobile,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Les 3 informations utiles en haut */}
            <UnifiedKpiCards
              totalSavings={totalSavings}
              plannedExpensesUntilDate={plannedExpensesUntilDate}
              plannedExpensesCount={plannedExpensesCount}
              projectedSavings={projectedSavings}
              selectedDateLabel={selectedDateLabel}
              inflowsUntilDate={inflowsUntilDate}
              accumulatedInterestUntilDate={accumulatedInterestUntilDate}
            />

            {/* 2. Graphe d'évolution de l'épargne avec slider temporel */}
            <UnifiedEvolutionChart
              monthlyData={forecast.monthlyData}
              selectedIndex={safeSelectedMonthIndex}
              onSelectIndex={setSelectedMonthIndex}
              safetyCushionTarget={safetyCushionTarget}
            />

            {/* 3. Toutes les sections de gestion en bas (Épargnes, Sous de côté, Dépenses, Rentrées) */}
            <UnifiedManagementSections
              accounts={accounts}
              onOpenAddSavings={() => setIsAddSavingsVisible(true)}
              onUpdateAccountAmount={(id, amount) =>
                updateAccount(id, { amount })
              }
              onRemoveAccount={removeAccount}
              monthlySavings={monthlyConfig.monthlyTotal}
              onUpdateMonthlySavings={updateMonthlyTotal}
              expenses={allPlannedExpenses}
              onOpenAddExpense={() => setIsAddExpenseVisible(true)}
              onToggleExpenseActive={toggleExpenseActive}
              onRemoveExpense={removeExpense}
              onUpdateExpenseDate={(id, targetDate) =>
                updateExpense(id, { targetDate })
              }
              inflows={inflows}
              onOpenAddInflow={() => setIsAddInflowVisible(true)}
              onToggleInflowActive={toggleInflow}
              onRemoveInflow={removeInflow}
              onUpdateInflowDate={(id, targetDate) =>
                updateInflow(id, { targetDate })
              }
            />
          </ScrollView>

          {/* Modals de saisie */}
          <AddSavingsModal
            visible={isAddSavingsVisible}
            onClose={() => setIsAddSavingsVisible(false)}
            onSubmit={addAccount}
          />

          <AddExpenseModal
            visible={isAddExpenseVisible}
            onClose={() => setIsAddExpenseVisible(false)}
            onSubmit={(data) => addExpense({ ...data, isActive: true })}
          />

          <AddInflowModal
            visible={isAddInflowVisible}
            onClose={() => setIsAddInflowVisible(false)}
            onSubmit={addInflow}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function App(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <LinearGradient
        colors={gradient.colors}
        locations={gradient.locations}
        start={gradient.start}
        end={gradient.end}
        style={styles.loadingContainer}
      >
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#0D9488" />
      </LinearGradient>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen />
      </>
    );
  }

  return <AuthenticatedDashboard />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    maxWidth: 1300,
    width: "100%",
    alignSelf: "center",
  },
  scrollContentMobile: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 14,
  },
});
