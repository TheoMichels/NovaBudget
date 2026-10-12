import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { SavingsAccount } from "../../types/savingsAccount";
import { useProjections } from "../../hooks/useProjections";
import { useProjectionEngine } from "../../hooks/useProjectionEngine";
import { ProjectionKpiCards } from "./ProjectionKpiCards";
import { ProjectionChart } from "./ProjectionChart";
import { MonthlySavingsController } from "./MonthlySavingsController";
import { InflowsSection } from "./InflowsSection";
import { FutureProjectsSection } from "./FutureProjectsSection";
import { SmartRecommendationCard } from "./SmartRecommendationCard";
import { AddProjectModal } from "./AddProjectModal";
import { AddInflowModal } from "./AddInflowModal";

interface ProjectionsTabProps {
  accounts: SavingsAccount[];
  safetyCushionTarget?: number;
  isAddProjectVisible: boolean;
  isAddInflowVisible: boolean;
  onCloseAddProject: () => void;
  onCloseAddInflow: () => void;
  onOpenAddProject: () => void;
  onOpenAddInflow: () => void;
}

export function ProjectionsTab({
  accounts,
  safetyCushionTarget = 20000,
  isAddProjectVisible,
  isAddInflowVisible,
  onCloseAddProject,
  onCloseAddInflow,
  onOpenAddProject,
  onOpenAddInflow,
}: ProjectionsTabProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const {
    projects,
    inflows,
    monthlyConfig,
    horizonMonths,
    setHorizonMonths,
    addProject,
    toggleProject,
    removeProject,
    addInflow,
    toggleInflow,
    removeInflow,
    updateMonthlyTotal,
  } = useProjections();

  const forecast = useProjectionEngine(
    accounts,
    projects,
    inflows,
    monthlyConfig,
    horizonMonths,
    safetyCushionTarget
  );

  return (
    <View style={styles.container}>
      {/* 1. Header KPIs & Horizon Controller */}
      <ProjectionKpiCards
        forecast={forecast}
        horizonMonths={horizonMonths}
        onSelectHorizon={setHorizonMonths}
        monthlySavings={monthlyConfig.monthlyTotal}
        safetyCushionTarget={safetyCushionTarget}
      />

      {/* 2. Interactive SVG Trajectory Chart */}
      <ProjectionChart
        monthlyData={forecast.monthlyData}
        safetyCushionTarget={safetyCushionTarget}
      />

      {/* 3. Dual Column: Levers (Left) vs Projects & Insights (Right) */}
      <View style={[styles.columnsRow, !isDesktop && styles.columnsStacked]}>
        {/* Left column: Monthly Savings & Inflows */}
        <View style={[styles.column, isDesktop && { flex: 5 }]}>
          <MonthlySavingsController
            monthlyConfig={monthlyConfig}
            onUpdateTotal={updateMonthlyTotal}
            weightedAnnualRate={forecast.weightedAnnualRate}
            initialSavings={forecast.initialSavings}
          />

          <InflowsSection
            inflows={inflows}
            onOpenAdd={onOpenAddInflow}
            onToggleActive={toggleInflow}
            onRemove={removeInflow}
          />
        </View>

        {/* Right column: Future Projects & Smart Recommendation */}
        <View style={[styles.column, isDesktop && { flex: 7 }]}>
          <FutureProjectsSection
            projects={projects}
            feasibilities={forecast.feasibilities}
            onOpenAdd={onOpenAddProject}
            onToggleActive={toggleProject}
            onRemove={removeProject}
          />

          <SmartRecommendationCard
            forecast={forecast}
            monthlySavings={monthlyConfig.monthlyTotal}
          />
        </View>
      </View>

      {/* Modals */}
      <AddProjectModal
        visible={isAddProjectVisible}
        onClose={onCloseAddProject}
        onSubmit={addProject}
      />

      <AddInflowModal
        visible={isAddInflowVisible}
        onClose={onCloseAddInflow}
        onSubmit={addInflow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    width: "100%",
  },
  columnsRow: {
    flexDirection: "row",
    gap: 20,
  },
  columnsStacked: {
    flexDirection: "column",
  },
  column: {
    minWidth: 0,
    gap: 20,
  },
});
