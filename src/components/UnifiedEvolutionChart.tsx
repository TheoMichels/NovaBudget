import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  Platform,
  PointerEvent as RNPointerEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { colors, shadows } from "../theme/colors";
import { formatEuro } from "../hooks/useForecast";
import { ProjectionMonthPoint } from "../types/projection";
import { formatFrenchMonthYear } from "../utils/dateUtils";

interface DomPointerTarget {
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
  hasPointerCapture?: (pointerId: number) => boolean;
  getBoundingClientRect?: () => { left: number; top: number; width: number; height: number };
}

export interface CumulativeProjectionEvent {
  id: string;
  type: "project" | "inflow";
  title: string;
  amount: number;
  dateStr: string;
  monthLabel: string;
  monthIndex: number;
}

export interface UnifiedEvolutionChartProps {
  monthlyData: ProjectionMonthPoint[]; // Données mois par mois (dateStr, label, capital, etc.)
  selectedIndex: number; // Mois actuellement sélectionné (0 = date du jour)
  onSelectIndex: (index: number) => void; // Callback pour changer de mois
  safetyCushionTarget?: number;
}

export function UnifiedEvolutionChart({
  monthlyData,
  selectedIndex,
  onSelectIndex,
  safetyCushionTarget,
}: UnifiedEvolutionChartProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isNarrow = width < 400;

  const [containerWidth, setContainerWidth] = useState<number>(600);

  const maxIndex = Math.max(0, monthlyData.length - 1);
  const safeSelectedIndex = Math.min(Math.max(0, selectedIndex), maxIndex);
  const selectedPoint = monthlyData[safeSelectedIndex] ?? null;
  const initialPoint = monthlyData[0] ?? null;

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setContainerWidth(w);
    }
  };

  // SVG Chart geometry
  const chartHeight = isMobile ? 220 : 250;
  const padding = {
    top: 24,
    right: 24,
    bottom: 34,
    left: isNarrow ? 44 : 54,
  };
  const innerWidth = Math.max(100, containerWidth - padding.left - padding.right);
  const innerHeight = Math.max(60, chartHeight - padding.top - padding.bottom);

  // Synchronization ref for fast, continuous scrubbing without stale state
  const lastIndexRef = useRef<number>(safeSelectedIndex);
  useEffect(() => {
    lastIndexRef.current = safeSelectedIndex;
  }, [safeSelectedIndex]);

  // Target index calculation from X position on chart
  const updateIndexRef = useRef<(x: number, force?: boolean) => void>(() => {});
  updateIndexRef.current = (x: number, force = false) => {
    if (innerWidth <= 0 || maxIndex <= 0) return;
    const ratio = Math.max(0, Math.min(1, (x - padding.left) / innerWidth));
    const targetIdx = Math.round(ratio * maxIndex);
    if (force || targetIdx !== lastIndexRef.current) {
      lastIndexRef.current = targetIdx;
      onSelectIndex(targetIdx);
    }
  };

  // Mobile Touch PanResponder
  const panStartLocationXRef = useRef<number>(0);
  const chartPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        panStartLocationXRef.current = evt.nativeEvent.locationX;
        updateIndexRef.current(evt.nativeEvent.locationX, true);
      },
      onPanResponderMove: (
        evt: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        const currentX =
          typeof gestureState.dx === "number" && !isNaN(gestureState.dx)
            ? panStartLocationXRef.current + gestureState.dx
            : evt.nativeEvent.locationX;
        updateIndexRef.current(currentX, false);
      },
    })
  ).current;

  // Web Pointer Drag & Click Handlers
  const isDraggingRef = useRef<boolean>(false);

  const handlePointerDown = (e: RNPointerEvent) => {
    isDraggingRef.current = true;
    const pointerId = e.nativeEvent.pointerId;
    const clientX = e.nativeEvent.clientX;
    const domTarget = e.currentTarget as unknown as DomPointerTarget | null;

    if (domTarget?.setPointerCapture && typeof pointerId === "number") {
      try {
        domTarget.setPointerCapture(pointerId);
      } catch {
        // Fallback if setPointerCapture fails
      }
    }

    if (domTarget?.getBoundingClientRect && typeof clientX === "number") {
      const rect = domTarget.getBoundingClientRect();
      const x = clientX - rect.left;
      updateIndexRef.current(x, true);
      return;
    }

    const nativeEvt = e.nativeEvent as unknown as { locationX?: number; offsetX?: number };
    const x = nativeEvt.locationX ?? nativeEvt.offsetX ?? 0;
    updateIndexRef.current(x, true);
  };

  const handlePointerMove = (e: RNPointerEvent) => {
    if (!isDraggingRef.current) return;
    const clientX = e.nativeEvent.clientX;
    const domTarget = e.currentTarget as unknown as DomPointerTarget | null;

    if (domTarget?.getBoundingClientRect && typeof clientX === "number") {
      const rect = domTarget.getBoundingClientRect();
      const x = clientX - rect.left;
      updateIndexRef.current(x, false);
      return;
    }

    const nativeEvt = e.nativeEvent as unknown as { locationX?: number; offsetX?: number };
    const x = nativeEvt.locationX ?? nativeEvt.offsetX ?? 0;
    updateIndexRef.current(x, false);
  };

  const handlePointerUp = (e: RNPointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const pointerId = e.nativeEvent.pointerId;
    const domTarget = e.currentTarget as unknown as DomPointerTarget | null;

    if (domTarget?.releasePointerCapture && typeof pointerId === "number") {
      try {
        if (
          !domTarget.hasPointerCapture ||
          domTarget.hasPointerCapture(pointerId)
        ) {
          domTarget.releasePointerCapture(pointerId);
        }
      } catch {
        // Fallback if releasePointerCapture fails
      }
    }
  };

  const handlePointerCancel = (e: RNPointerEvent) => {
    handlePointerUp(e);
  };

  // Cumulative events from month 0 up to safeSelectedIndex inclusive
  const cumulativeEvents = useMemo<CumulativeProjectionEvent[]>(() => {
    const list: CumulativeProjectionEvent[] = [];
    const limit = Math.min(safeSelectedIndex + 1, monthlyData.length);
    for (let i = 0; i < limit; i++) {
      const month = monthlyData[i];
      if (month && month.events && month.events.length > 0) {
        for (const ev of month.events) {
          list.push({
            id: ev.id,
            type: ev.type,
            title: ev.title,
            amount: ev.amount,
            dateStr: month.dateStr,
            monthLabel: month.label,
            monthIndex: month.monthIndex,
          });
        }
      }
    }
    return list;
  }, [monthlyData, safeSelectedIndex]);

  // Date formatting for the active point
  const formattedMonthYear = selectedPoint?.dateStr
    ? formatFrenchMonthYear(selectedPoint.dateStr, "full")
    : selectedPoint?.label ?? "";

  // Net difference vs Month 0
  const capitalDiff =
    selectedPoint && initialPoint
      ? selectedPoint.capital - initialPoint.capital
      : 0;
  const capitalDiffPct =
    initialPoint && initialPoint.capital > 0
      ? ((capitalDiff / initialPoint.capital) * 100).toFixed(1)
      : "0.0";

  const capitals = monthlyData.map((d) => d.capital);
  const maxVal = Math.max(
    (safetyCushionTarget ?? 0) * 1.15,
    ...(capitals.length > 0 ? capitals : [20000]),
    10000
  ) * 1.08;

  const minVal = Math.max(
    0,
    Math.min(
      safetyCushionTarget ? safetyCushionTarget * 0.8 : Infinity,
      ...(capitals.length > 0 ? capitals : [0])
    ) * 0.92
  );

  const valueRange = maxVal - minVal || 1;

  const getY = (val: number): number => {
    return padding.top + innerHeight - ((val - minVal) / valueRange) * innerHeight;
  };

  const getX = (idx: number): number => {
    const count = Math.max(1, maxIndex);
    return padding.left + (idx / count) * innerWidth;
  };

  // Build SVG smooth path
  let pathD = "";
  let areaD = `M ${getX(0)} ${padding.top + innerHeight} `;

  monthlyData.forEach((pt, i) => {
    const x = getX(i);
    const y = getY(pt.capital);
    if (i === 0) {
      pathD += `M ${x} ${y} `;
      areaD += `L ${x} ${y} `;
    } else {
      const prevX = getX(i - 1);
      const prevY = getY(monthlyData[i - 1].capital);
      const cpX = prevX + (x - prevX) / 2;
      pathD += `C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y} `;
      areaD += `C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y} `;
    }
  });

  if (monthlyData.length > 0) {
    areaD += `L ${getX(maxIndex)} ${padding.top + innerHeight} Z`;
  }

  // Selected point coordinates
  const selectedX = getX(safeSelectedIndex);
  const selectedY = selectedPoint ? getY(selectedPoint.capital) : padding.top;
  const cushionY = safetyCushionTarget ? getY(safetyCushionTarget) : null;

  // Grid ticks (4 lines)
  const gridTicks = [0, 0.33, 0.66, 1].map((pct) => minVal + pct * valueRange);

  if (monthlyData.length === 0) {
    return (
      <View style={[styles.card, styles.emptyContainer]}>
        <Text style={styles.emptyText}>Aucune donnée de projection disponible.</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.card, isMobile && styles.cardMobile]}
      onLayout={handleContainerLayout}
    >
      {/* 1. Header with Selected Month / Year and Capital Value */}
      <View style={styles.cardHeader} testID="chart-card-header">
        <View style={styles.headerInfoCol}>
          <Text
            testID="chart-date-headline"
            style={[
              styles.selectedDateHeadline,
              isNarrow && styles.selectedDateHeadlineNarrow,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {`📅 ${formattedMonthYear}`}
          </Text>
        </View>

        <View style={styles.headerCapitalCol}>
          <Text
            testID="chart-capital-value"
            style={[
              styles.selectedCapitalText,
              isNarrow && styles.selectedCapitalTextNarrow,
            ]}
            numberOfLines={1}
          >
            {selectedPoint ? formatEuro(selectedPoint.capital) : "0 €"}
          </Text>
          <View style={styles.diffBadgeSlot}>
            {safeSelectedIndex === 0 ? (
              <View
                testID="chart-diff-badge"
                style={[styles.diffBadge, styles.diffBadgeNeutral]}
              >
                <Text style={[styles.diffBadgeText, styles.diffBadgeTextNeutral]}>
                  Point de départ
                </Text>
              </View>
            ) : (
              <View
                testID="chart-diff-badge"
                style={[
                  styles.diffBadge,
                  capitalDiff >= 0
                    ? styles.diffBadgePositive
                    : styles.diffBadgeNegative,
                ]}
              >
                <Text
                  style={[
                    styles.diffBadgeText,
                    capitalDiff >= 0
                      ? styles.diffBadgeTextPositive
                      : styles.diffBadgeTextNegative,
                  ]}
                  numberOfLines={1}
                >
                  {isNarrow
                    ? `${capitalDiff >= 0 ? "+" : ""}${capitalDiffPct}%`
                    : `${capitalDiff >= 0 ? `+${formatEuro(capitalDiff)}` : formatEuro(capitalDiff)} (${capitalDiff >= 0 ? `+${capitalDiffPct}%` : `${capitalDiffPct}%`})`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 2. Interactive SVG Graph with Emerald Gradient (#0D9488) */}
      <View
        style={styles.chartWrapper}
        {...(Platform.OS === "web" ? {} : chartPanResponder.panHandlers)}
        onPointerDown={Platform.OS === "web" ? handlePointerDown : undefined}
        onPointerMove={Platform.OS === "web" ? handlePointerMove : undefined}
        onPointerUp={Platform.OS === "web" ? handlePointerUp : undefined}
        onPointerCancel={Platform.OS === "web" ? handlePointerCancel : undefined}
      >
        <Svg width={containerWidth} height={chartHeight}>
          <Defs>
            {/* Emerald Gradient */}
            <SvgLinearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#0D9488" stopOpacity={0.32} />
              <Stop offset="75%" stopColor="#0D9488" stopOpacity={0.06} />
              <Stop offset="100%" stopColor="#0D9488" stopOpacity={0.0} />
            </SvgLinearGradient>
          </Defs>

          {/* Horizontal Grid Lines & Y Axis Labels */}
          {gridTicks.map((val, idx) => {
            const y = getY(val);
            const labelText = `${Math.round(val / 1000)}k€`;
            return (
              <G key={idx}>
                <Line
                  x1={padding.left}
                  y1={y}
                  x2={containerWidth - padding.right}
                  y2={y}
                  stroke={colors.divider}
                  strokeDasharray="3,3"
                  strokeWidth="1"
                />
                <SvgText
                  x={padding.left - 8}
                  y={y + 3}
                  fontSize="10"
                  fontWeight="600"
                  fill={colors.textMuted}
                  textAnchor="end"
                >
                  {labelText}
                </SvgText>
              </G>
            );
          })}

          {/* Optional Safety Cushion Target Dotted Line */}
          {cushionY !== null && safetyCushionTarget && safetyCushionTarget > 0 && (
            <G>
              <Line
                x1={padding.left}
                y1={cushionY}
                x2={containerWidth - padding.right}
                y2={cushionY}
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <SvgText
                x={containerWidth - padding.right}
                y={cushionY - 5}
                fontSize="9"
                fontWeight="700"
                fill="#D97706"
                textAnchor="end"
              >
                {`Seuil sécurité (${Math.round(safetyCushionTarget / 1000)}k€)`}
              </SvgText>
            </G>
          )}

          {/* Area Fill */}
          <Path d={areaD} fill="url(#emeraldGradient)" />

          {/* Main Curve Line in #0D9488 */}
          <Path
            d={pathD}
            fill="none"
            stroke="#0D9488"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Selected Point Vertical Guideline */}
          <Line
            x1={selectedX}
            y1={padding.top}
            x2={selectedX}
            y2={padding.top + innerHeight}
            stroke="rgba(13, 148, 136, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />

          {/* Highlighted Selected Point (Outer Pulse, Emerald Circle, Inner White Dot) */}
          <Circle
            cx={selectedX}
            cy={selectedY}
            r={13}
            fill="rgba(13, 148, 136, 0.18)"
          />
          <Circle
            cx={selectedX}
            cy={selectedY}
            r={6.5}
            fill="#0D9488"
            stroke="#FFFFFF"
            strokeWidth={2.5}
          />
          <Circle cx={selectedX} cy={selectedY} r={2.5} fill="#FFFFFF" />

          {/* Milestone markers along the curve */}
          {monthlyData.map((d, i) => {
            if (i === 0 || i === maxIndex) {
              const x = getX(i);
              const y = getY(d.capital);
              if (i !== safeSelectedIndex) {
                return (
                  <Circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={3.5}
                    fill="#0D9488"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                );
              }
            }
            return null;
          })}

          {/* X Axis Date Labels */}
          {monthlyData.map((d, i) => {
            const stepInterval =
              monthlyData.length > 24
                ? Math.ceil(monthlyData.length / 6)
                : monthlyData.length > 12
                ? 3
                : 2;

            if (i === 0 || i === maxIndex || i % stepInterval === 0) {
              const x = getX(i);
              return (
                <SvgText
                  key={i}
                  x={x}
                  y={chartHeight - 12}
                  fontSize="10"
                  fontWeight={i === safeSelectedIndex ? "800" : "600"}
                  fill={
                    i === safeSelectedIndex ? "#0D9488" : colors.textSecondary
                  }
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              );
            }
            return null;
          })}
        </Svg>
      </View>

      {/* 3. Events timeline up to selected date (discreet, zero layout shift) */}
      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <View style={styles.eventsSectionTitleRow}>
            <Text style={styles.eventsSectionTitle} numberOfLines={1}>
              Événements jusqu'à ce mois
            </Text>
            {cumulativeEvents.length > 0 && (
              <View style={styles.eventsBadgeCount}>
                <Text style={styles.eventsBadgeCountText}>
                  {cumulativeEvents.length}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.eventsSectionDateHint} numberOfLines={1}>
            {cumulativeEvents.length > 0
              ? `Jusqu'à ${formattedMonthYear}`
              : "Aucun impact prévu"}
          </Text>
        </View>

        <View style={styles.eventsContentSlot}>
          {cumulativeEvents.length === 0 ? (
            <View style={styles.emptyEventsBox}>
              <Text style={styles.emptyEventsIcon}>🗓️</Text>
              <Text style={styles.emptyEventsText} numberOfLines={1}>
                Aucun événement planifié jusqu'à cette date
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.eventsScrollView}
              contentContainerStyle={styles.eventsScrollContent}
            >
              {cumulativeEvents.map((ev, idx) => {
                const isProject = ev.type === "project";
                return (
                  <View
                    key={`${ev.id}-${ev.monthIndex}-${idx}`}
                    style={[
                      styles.eventChip,
                      isProject
                        ? styles.eventChipProject
                        : styles.eventChipInflow,
                    ]}
                  >
                    {/* Date Badge */}
                    <View
                      style={[
                        styles.eventChipDateBadge,
                        isProject
                          ? styles.eventChipDateBadgeProject
                          : styles.eventChipDateBadgeInflow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.eventChipDateText,
                          isProject
                            ? styles.eventChipDateTextProject
                            : styles.eventChipDateTextInflow,
                        ]}
                      >
                        {ev.monthLabel}
                      </Text>
                    </View>

                    {/* Type Icon */}
                    <Text style={styles.eventChipIcon}>
                      {isProject ? "🚗" : "⚡"}
                    </Text>

                    {/* Amount */}
                    <Text
                      style={[
                        styles.eventChipAmount,
                        isProject
                          ? styles.eventChipAmountProject
                          : styles.eventChipAmountInflow,
                      ]}
                    >
                      {isProject
                        ? `-${formatEuro(ev.amount)}`
                        : `+${formatEuro(ev.amount)}`}
                    </Text>

                    {/* Title */}
                    <Text
                      style={[
                        styles.eventChipTitle,
                        isProject
                          ? styles.eventChipTitleProject
                          : styles.eventChipTitleInflow,
                      ]}
                      numberOfLines={1}
                    >
                      {ev.title}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...shadows.sm,
    width: "100%",
    ...(Platform.OS === "web"
      ? ({ backdropFilter: "blur(20px)" } as unknown as ViewStyle)
      : {}),
  },
  cardMobile: {
    padding: 16,
    borderRadius: 20,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "nowrap",
    gap: 8,
    marginBottom: 16,
  },
  headerInfoCol: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  selectedDateHeadline: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  selectedDateHeadlineNarrow: {
    fontSize: 16,
  },
  headerSubtext: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  headerCapitalCol: {
    alignItems: "flex-end",
    flexShrink: 0,
    minWidth: 80,
  },
  selectedCapitalText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0D9488",
    letterSpacing: -0.4,
  },
  selectedCapitalTextNarrow: {
    fontSize: 19,
  },
  diffBadgeSlot: {
    minHeight: 22,
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 3,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  diffBadgeNeutral: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  diffBadgePositive: {
    backgroundColor: colors.positiveSoft,
  },
  diffBadgeNegative: {
    backgroundColor: colors.dangerSoft,
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  diffBadgeTextNeutral: {
    color: "#64748B",
  },
  diffBadgeTextPositive: {
    color: colors.primary,
  },
  diffBadgeTextNegative: {
    color: colors.danger,
  },
  chartWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          cursor: "ew-resize",
          userSelect: "none",
          touchAction: "none",
        } as unknown as ViewStyle)
      : {}),
  },
  eventsSection: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    height: 76,
    justifyContent: "center",
  },
  eventsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  eventsSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  eventsSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  eventsBadgeCount: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  eventsBadgeCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.brandMuted,
  },
  eventsSectionDateHint: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
    flexShrink: 1,
  },
  eventsContentSlot: {
    height: 32,
    justifyContent: "center",
  },
  eventsScrollView: {
    height: 32,
  },
  eventsScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  emptyEventsBox: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  emptyEventsIcon: {
    fontSize: 12,
    marginRight: 6,
    opacity: 0.75,
  },
  emptyEventsText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
  },
  eventChip: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  eventChipProject: {
    backgroundColor: "#FEF3C7",
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  eventChipInflow: {
    backgroundColor: "#DBEAFE",
    borderColor: "rgba(37, 99, 235, 0.35)",
  },
  eventChipDateBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 5,
  },
  eventChipDateBadgeProject: {
    backgroundColor: "rgba(245, 158, 11, 0.18)",
  },
  eventChipDateBadgeInflow: {
    backgroundColor: "rgba(37, 99, 235, 0.15)",
  },
  eventChipDateText: {
    fontSize: 10,
    fontWeight: "700",
  },
  eventChipDateTextProject: {
    color: "#B45309",
  },
  eventChipDateTextInflow: {
    color: "#1D4ED8",
  },
  eventChipIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  eventChipAmount: {
    fontSize: 11,
    fontWeight: "800",
    marginRight: 6,
  },
  eventChipAmountProject: {
    color: "#B45309",
  },
  eventChipAmountInflow: {
    color: "#1D4ED8",
  },
  eventChipTitle: {
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 160,
  },
  eventChipTitleProject: {
    color: "#78350F",
  },
  eventChipTitleInflow: {
    color: "#1E3A8A",
  },
});
