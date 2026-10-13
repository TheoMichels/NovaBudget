import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradient } from "./src/theme/colors";
import { useSavings } from "./src/hooks/useSavings";
import { useExpenses } from "./src/hooks/useExpenses";
import { useForecast } from "./src/hooks/useForecast";
import { useSafetyCushion } from "./src/hooks/useSafetyCushion";
import { Header } from "./src/components/Header";
import { MetricCards } from "./src/components/MetricCards";
import { SimulatorWaterfall } from "./src/components/SimulatorWaterfall";
import { SavingsSection } from "./src/components/SavingsSection";
import { ExpensesSection } from "./src/components/ExpensesSection";
import { AddSavingsModal } from "./src/components/AddSavingsModal";
import { AddExpenseModal } from "./src/components/AddExpenseModal";
import { ProjectionsTab } from "./src/components/projections/ProjectionsTab";

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  const [activeTab, setActiveTab] = useState<"current" | "projections">("current");
  const [isAddSavingsVisible, setIsAddSavingsVisible] = useState(false);
  const [isAddExpenseVisible, setIsAddExpenseVisible] = useState(false);
  const [isAddProjectVisible, setIsAddProjectVisible] = useState(false);
  const [isAddInflowVisible, setIsAddInflowVisible] = useState(false);

  // Hooks
  const {
    accounts,
    addAccount,
    updateAccount,
    removeAccount,
  } = useSavings();

  const {
    expenses,
    addExpense,
    toggleExpenseActive,
    removeExpense,
    updateExpense,
  } = useExpenses();

  const {
    safetyCushionTarget,
    updateSafetyCushionTarget,
  } = useSafetyCushion();

  const forecast = useForecast(accounts, expenses, safetyCushionTarget);

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
          {/* Top Bar Navigation avec Onglets et Actions contextuelles */}
          <Header
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenAddSavings={() => setIsAddSavingsVisible(true)}
            onOpenAddExpense={() => setIsAddExpenseVisible(true)}
            onOpenAddProject={() => setIsAddProjectVisible(true)}
            onOpenAddInflow={() => setIsAddInflowVisible(true)}
          />

          {/* Main Scrollable Dashboard */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              isMobile && styles.scrollContentMobile,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "current" ? (
              <>
                {/* KPI Metric Cards */}
                <MetricCards
                  totalSavings={forecast.totalSavings}
                  accountsCount={accounts.length}
                  totalActiveExpenses={forecast.totalActiveExpenses}
                  activeExpensesCount={forecast.activeExpenses.length}
                  postTotalSavings={forecast.postTotalSavings}
                />

                {/* Dynamic Forecast Waterfall Banner */}
                <SimulatorWaterfall
                  initialSavings={forecast.totalSavings}
                  expensesAmount={forecast.totalActiveExpenses}
                  residualSavings={forecast.postTotalSavings}
                  cushionPct={forecast.cushionPct}
                  freePct={forecast.freePct}
                  expensesPct={forecast.expensesPct}
                  retentionRate={forecast.retentionRate}
                  safetyCushionTarget={forecast.safetyCushionTarget}
                  onUpdateSafetyCushionTarget={updateSafetyCushionTarget}
                />

                {/* Operational Dual Column: Savings (Left) vs Expenses (Right) */}
                <View style={[styles.columnsRow, !isDesktop && styles.columnsStacked]}>
                  <View style={[styles.column, isDesktop && { flex: 7 }]}>
                    <SavingsSection
                      accounts={accounts}
                      onOpenAdd={() => setIsAddSavingsVisible(true)}
                      onUpdateAmount={(id, amount) => updateAccount(id, { amount })}
                      onRemove={removeAccount}
                    />
                  </View>

                  <View style={[styles.column, isDesktop && { flex: 5 }]}>
                    <ExpensesSection
                      expenses={expenses}
                      onOpenAdd={() => setIsAddExpenseVisible(true)}
                      onToggleActive={toggleExpenseActive}
                      onRemove={removeExpense}
                      onUpdateDate={(id, targetDate) => updateExpense(id, { targetDate })}
                    />
                  </View>
                </View>
              </>
            ) : (
              <ProjectionsTab
                accounts={accounts}
                safetyCushionTarget={safetyCushionTarget}
                isAddProjectVisible={isAddProjectVisible}
                isAddInflowVisible={isAddInflowVisible}
                onCloseAddProject={() => setIsAddProjectVisible(false)}
                onCloseAddInflow={() => setIsAddInflowVisible(false)}
                onOpenAddProject={() => setIsAddProjectVisible(true)}
                onOpenAddInflow={() => setIsAddInflowVisible(true)}
              />
            )}
          </ScrollView>

          {/* Modals Court Terme */}
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  columnsRow: {
    flexDirection: "row",
    gap: 20,
  },
  columnsStacked: {
    flexDirection: "column",
    gap: 14,
  },
  column: {
    minWidth: 0,
  },
});
