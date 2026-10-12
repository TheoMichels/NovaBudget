import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, shadows } from "../theme/colors";
import { cursorPointer } from "../theme/webCursor";
import {
  MONTHS_FR,
  formatFrenchMonthYear,
  getRelativeMonthDescription,
  parseYearMonth,
  toYearMonthString,
} from "../utils/dateUtils";

interface MonthYearCalendarProps {
  value: string; // e.g. "2026-08"
  onChange: (date: string) => void;
  accentColor?: string;
  minYear?: number;
  maxYear?: number;
  showPresets?: boolean;
}

export function MonthYearCalendar({
  value,
  onChange,
  accentColor = colors.warning,
  minYear = 2024,
  maxYear = 2035,
  showPresets = true,
}: MonthYearCalendarProps) {
  const { year: selectedYear, month: selectedMonth } = parseYearMonth(value);
  const [viewYear, setViewYear] = useState<number>(selectedYear);

  // Sync viewYear if value changes from outside
  useEffect(() => {
    const { year } = parseYearMonth(value);
    setViewYear(year);
  }, [value]);

  const now = new Date();
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth() + 1;

  const handlePrevYear = () => {
    if (viewYear > minYear) {
      setViewYear((prev) => prev - 1);
    }
  };

  const handleNextYear = () => {
    if (viewYear < maxYear) {
      setViewYear((prev) => prev + 1);
    }
  };

  const handleSelectMonth = (monthNumber: number) => {
    const newDate = toYearMonthString(viewYear, monthNumber);
    onChange(newDate);
  };

  const handlePresetOffset = (offsetMonths: number) => {
    const targetDateObj = new Date(currentRealYear, currentRealMonth - 1 + offsetMonths, 1);
    const targetY = targetDateObj.getFullYear();
    const targetM = targetDateObj.getMonth() + 1;
    setViewYear(targetY);
    onChange(toYearMonthString(targetY, targetM));
  };

  // Generate a sliding window of years for quick chips (e.g. 5 years)
  const quickYears = [
    viewYear - 2,
    viewYear - 1,
    viewYear,
    viewYear + 1,
    viewYear + 2,
  ].filter((y) => y >= minYear && y <= maxYear);

  const relativeText = getRelativeMonthDescription(value);

  return (
    <View style={styles.calendarContainer}>
      {/* Year Navigation Bar */}
      <View style={styles.yearHeader}>
        <Pressable
          style={[
            styles.yearNavBtn,
            viewYear <= minYear && styles.btnDisabled,
            cursorPointer,
          ]}
          onPress={handlePrevYear}
          disabled={viewYear <= minYear}
          hitSlop={8}
          accessibilityLabel="Année précédente"
        >
          <Text style={styles.yearNavIcon}>‹</Text>
        </Pressable>

        <View style={styles.yearCenter}>
          <Text style={styles.yearTitle}>{viewYear}</Text>
          {viewYear === currentRealYear && (
            <View style={styles.currentYearBadge}>
              <Text style={styles.currentYearBadgeText}>En cours</Text>
            </View>
          )}
        </View>

        <Pressable
          style={[
            styles.yearNavBtn,
            viewYear >= maxYear && styles.btnDisabled,
            cursorPointer,
          ]}
          onPress={handleNextYear}
          disabled={viewYear >= maxYear}
          hitSlop={8}
          accessibilityLabel="Année suivante"
        >
          <Text style={styles.yearNavIcon}>›</Text>
        </Pressable>
      </View>

      {/* Quick Year Selector Pills */}
      <View style={styles.quickYearsRow}>
        {quickYears.map((y) => {
          const isCurrentView = y === viewYear;
          const isSelectedYear = y === selectedYear;
          return (
            <Pressable
              key={y}
              style={[
                styles.quickYearChip,
                cursorPointer,
                isCurrentView && styles.quickYearChipActive,
                isSelectedYear && !isCurrentView && styles.quickYearChipSelected,
              ]}
              onPress={() => setViewYear(y)}
            >
              <Text
                style={[
                  styles.quickYearChipText,
                  isCurrentView && styles.quickYearChipTextActive,
                ]}
              >
                {y}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 12 Months Grid (4 columns x 3 rows) */}
      <View style={styles.monthGrid}>
        {MONTHS_FR.map((item) => {
          const isSelected =
            selectedYear === viewYear && selectedMonth === item.month;
          const isCurrentMonth =
            currentRealYear === viewYear && currentRealMonth === item.month;

          return (
            <Pressable
              key={item.key}
              style={[
                styles.monthCell,
                cursorPointer,
                isCurrentMonth && !isSelected && styles.monthCellCurrent,
                isSelected && [
                  styles.monthCellSelected,
                  { backgroundColor: accentColor },
                ],
              ]}
              onPress={() => handleSelectMonth(item.month)}
            >
              <View style={styles.monthCellContent}>
                <Text
                  style={[
                    styles.monthShortName,
                    isCurrentMonth && !isSelected && styles.monthShortNameCurrent,
                    isSelected && styles.monthShortNameSelected,
                  ]}
                >
                  {item.short}
                </Text>
                <Text
                  style={[
                    styles.monthKey,
                    isSelected && styles.monthKeySelected,
                  ]}
                >
                  {item.key}
                </Text>
              </View>

              {isCurrentMonth && !isSelected && (
                <View style={styles.todayIndicatorDot} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Quick Presets row */}
      {showPresets && (
        <View style={styles.presetsRow}>
          <Text style={styles.presetsLabel}>Raccourcis :</Text>
          <Pressable
            style={[styles.presetBtn, cursorPointer]}
            onPress={() => handlePresetOffset(0)}
          >
            <Text style={styles.presetBtnText}>Ce mois-ci</Text>
          </Pressable>
          <Pressable
            style={[styles.presetBtn, cursorPointer]}
            onPress={() => handlePresetOffset(3)}
          >
            <Text style={styles.presetBtnText}>+3 mois</Text>
          </Pressable>
          <Pressable
            style={[styles.presetBtn, cursorPointer]}
            onPress={() => handlePresetOffset(6)}
          >
            <Text style={styles.presetBtnText}>+6 mois</Text>
          </Pressable>
          <Pressable
            style={[styles.presetBtn, cursorPointer]}
            onPress={() => handlePresetOffset(12)}
          >
            <Text style={styles.presetBtnText}>+1 an</Text>
          </Pressable>
        </View>
      )}

      {/* Selected date feedback strip */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryIcon}>📅</Text>
          <Text style={styles.summaryDateText}>
            {formatFrenchMonthYear(value, "full")}
          </Text>
        </View>
        {relativeText ? (
          <View style={styles.relativeBadge}>
            <Text style={styles.relativeBadgeText}>{relativeText}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: "rgba(15, 41, 34, 0.025)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  yearHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  yearNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(15, 41, 34, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.3,
  },
  yearNavIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.brand,
    marginTop: -2,
  },
  yearCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.3,
  },
  currentYearBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentYearBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  quickYearsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  quickYearChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(15, 41, 34, 0.04)",
  },
  quickYearChipActive: {
    backgroundColor: colors.brand,
  },
  quickYearChipSelected: {
    borderWidth: 1,
    borderColor: colors.warning,
  },
  quickYearChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  quickYearChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "space-between",
  },
  monthCell: {
    width: "23%",
    minWidth: 62,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadows.sm,
  },
  monthCellCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBackground,
  },
  monthCellSelected: {
    borderColor: "transparent",
    ...shadows.md,
  },
  monthCellContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  monthShortName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.brand,
  },
  monthShortNameCurrent: {
    color: colors.primary,
  },
  monthShortNameSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  monthKey: {
    fontSize: 9,
    fontWeight: "500",
    color: colors.textMuted,
    marginTop: 1,
  },
  monthKeySelected: {
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
  },
  todayIndicatorDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  presetsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  presetsLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
  presetBtn: {
    backgroundColor: "rgba(15, 41, 34, 0.04)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  presetBtnText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryIcon: {
    fontSize: 13,
  },
  summaryDateText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.brand,
  },
  relativeBadge: {
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  relativeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.warning,
  },
});
