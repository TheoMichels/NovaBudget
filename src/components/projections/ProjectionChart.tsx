import React, { useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
import { colors, shadows } from "../../theme/colors";
import { cursorPointer } from "../../theme/webCursor";
import { formatEuro } from "../../hooks/useForecast";
import { ProjectionMonthPoint } from "../../types/projection";

interface ProjectionChartProps {
  monthlyData: ProjectionMonthPoint[];
  safetyCushionTarget: number;
}

export function ProjectionChart({
  monthlyData,
  safetyCushionTarget,
}: ProjectionChartProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isNarrow = width < 400;
  const [chartWidth, setChartWidth] = useState(600);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setChartWidth(w);
    }
  };

  const chartHeight = 240;
  const padding = { top: 25, right: 35, bottom: 35, left: 55 };
  const innerWidth = Math.max(100, chartWidth - padding.left - padding.right);
  const innerHeight = Math.max(50, chartHeight - padding.top - padding.bottom);

  // Compute scale boundaries
  const capitals = monthlyData.map((d) => d.capital);
  const maxVal = Math.max(
    safetyCushionTarget * 1.5,
    Math.max(...capitals, 50000) * 1.08
  );
  const minVal = Math.max(
    0,
    Math.min(safetyCushionTarget * 0.75, Math.min(...capitals) * 0.92)
  );

  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    return padding.top + innerHeight - ((val - minVal) / range) * innerHeight;
  };

  const getX = (idx: number) => {
    const count = Math.max(1, monthlyData.length - 1);
    return padding.left + (idx / count) * innerWidth;
  };

  // Build SVG path
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

  areaD += `L ${getX(monthlyData.length - 1)} ${padding.top + innerHeight} Z`;

  const cushionY = getY(safetyCushionTarget);

  // Y-axis grid lines (4 ticks)
  const gridTicks = [0, 0.33, 0.66, 1].map((pct) => minVal + pct * (maxVal - minVal));

  // Events list for bottom timeline
  const timelineEvents: {
    label: string;
    type: "project" | "inflow";
    title: string;
    amount: number;
  }[] = [];
  monthlyData.forEach((d) => {
    d.events.forEach((ev) => {
      timelineEvents.push({
        label: d.label,
        type: ev.type,
        title: ev.title,
        amount: ev.amount,
      });
    });
  });

  const activePoint =
    selectedIndex !== null ? monthlyData[selectedIndex] : null;

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      {/* Header with Title & Legends */}
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: isNarrow ? "100%" : 260 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Trajectoire du Patrimoine d'Épargne</Text>
            <View style={styles.tagLive}>
              <Text style={styles.tagLiveText}>Courbe Interactive</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Évolution mois par mois combinant versements, rentrées, intérêts et projets.
          </Text>
        </View>

        {/* Legends */}
        <View style={[styles.legendsRow, isMobile && styles.legendsRowMobile]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Épargne totale</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendLine,
                { borderColor: colors.danger, borderStyle: "dashed" },
              ]}
            />
            <Text style={styles.legendText}>Coussin ({formatEuro(safetyCushionTarget)})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Projet 🚗</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.inflow }]} />
            <Text style={styles.legendText}>Rentrée ⚡</Text>
          </View>
        </View>
      </View>

      {/* Selected Point Preview Box */}
      {activePoint && (
        <View style={[styles.tooltipBox, isMobile && styles.tooltipBoxMobile]}>
          <View style={[styles.tooltipLeft, isNarrow && styles.tooltipLeftNarrow]}>
            <Text style={styles.tooltipMonth}>{activePoint.label}</Text>
            <Text
              style={[
                styles.tooltipCapital,
                isNarrow && styles.tooltipCapitalNarrow,
              ]}
            >
              {formatEuro(activePoint.capital)}
            </Text>
          </View>
          <View style={styles.tooltipRight}>
            <Text style={styles.tooltipDetail}>
              Intérêts cumulés : +{formatEuro(activePoint.accumulatedInterest)}
            </Text>
            {activePoint.events.length > 0 && (
              <Text style={styles.tooltipEvents}>
                {activePoint.events
                  .map(
                    (e) =>
                      `${e.type === "project" ? "-" : "+"}${formatEuro(
                        e.amount
                      )} (${e.title})`
                  )
                  .join(" • ")}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => setSelectedIndex(null)}
            style={styles.closeTooltipBtn}
          >
            <Text style={{ fontSize: 11, color: "#FFFFFF" }}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* SVG Canvas Area */}
      <View style={styles.chartWrapper} onLayout={handleLayout}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <SvgLinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.28} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.0} />
            </SvgLinearGradient>
          </Defs>

          {/* Grid lines & Y labels */}
          {gridTicks.map((val, idx) => {
            const y = getY(val);
            const labelText = `${Math.round(val / 1000)}k€`;
            return (
              <G key={idx}>
                <Line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
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

          {/* Safety Cushion Line */}
          <Line
            x1={padding.left}
            y1={cushionY}
            x2={chartWidth - padding.right}
            y2={cushionY}
            stroke={colors.danger}
            strokeWidth="1.8"
            strokeDasharray="4,4"
          />
          <SvgText
            x={chartWidth - padding.right}
            y={cushionY - 5}
            fontSize="10"
            fontWeight="800"
            fill={colors.danger}
            textAnchor="end"
          >
            Seuil Sécurité ({Math.round(safetyCushionTarget / 1000)}k€)
          </SvgText>

          {/* Area Fill */}
          <Path d={areaD} fill="url(#chartGrad)" />

          {/* Smooth Line */}
          <Path
            d={pathD}
            fill="none"
            stroke={colors.primary}
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* X Axis Date Labels */}
          {monthlyData.map((d, i) => {
            const stepInterval =
              monthlyData.length > 20
                ? Math.ceil(monthlyData.length / 8)
                : Math.ceil(monthlyData.length / 6);
            if (
              i === 0 ||
              i === monthlyData.length - 1 ||
              i % stepInterval === 0
            ) {
              const x = getX(i);
              return (
                <SvgText
                  key={i}
                  x={x}
                  y={chartHeight - 10}
                  fontSize="10"
                  fontWeight="700"
                  fill={colors.textSecondary}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              );
            }
            return null;
          })}

          {/* Data Points & Event Markers */}
          {monthlyData.map((d, i) => {
            const x = getX(i);
            const y = getY(d.capital);
            const isSelected = selectedIndex === i;
            const hasProject = d.events.some((e) => e.type === "project");
            const hasInflow = d.events.some((e) => e.type === "inflow");
            const hasEvent = hasProject || hasInflow;

            if (i === 0 || i === monthlyData.length - 1 || hasEvent || isSelected) {
              const fillColor = hasProject
                ? colors.warning
                : hasInflow
                ? colors.inflow
                : colors.primary;
              const radius = isSelected ? 8 : hasEvent ? 7 : 4.5;

              return (
                <G key={i} onPress={() => setSelectedIndex(i)}>
                  <Circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={fillColor}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  {hasProject && (
                    <SvgText
                      x={x}
                      y={y - 10}
                      fontSize="10"
                      textAnchor="middle"
                    >
                      🚗
                    </SvgText>
                  )}
                  {hasInflow && !hasProject && (
                    <SvgText
                      x={x}
                      y={y - 10}
                      fontSize="10"
                      textAnchor="middle"
                    >
                      ⚡
                    </SvgText>
                  )}
                </G>
              );
            }
            return null;
          })}
        </Svg>
      </View>

      {/* Milestone Pills under chart */}
      <View style={styles.timelineRow}>
        <Text style={styles.timelineTitle}>JALONS CLÉS DE LA PÉRIODE :</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timelineScroll}
        >
          {timelineEvents.length === 0 ? (
            <Text style={styles.timelineEmpty}>
              Aucun projet ni rentrée exceptionnelle planifié sur cet horizon.
            </Text>
          ) : (
            timelineEvents.map((ev, idx) => (
              <View
                key={idx}
                style={[
                  styles.eventPill,
                  ev.type === "project"
                    ? styles.eventPillProject
                    : styles.eventPillInflow,
                ]}
              >
                <Text
                  style={[
                    styles.eventPillDate,
                    ev.type === "project"
                      ? { color: colors.warning }
                      : { color: colors.inflow },
                  ]}
                >
                  {ev.label}
                </Text>
                <Text style={styles.eventPillDivider}>•</Text>
                <Text
                  style={[
                    styles.eventPillAmount,
                    ev.type === "project"
                      ? { color: "#92400E" }
                      : { color: colors.inflow },
                  ]}
                >
                  {ev.type === "project" ? "-" : "+"}
                  {formatEuro(ev.amount)}
                </Text>
                <Text
                  style={[
                    styles.eventPillTitle,
                    isMobile && (isNarrow ? styles.eventPillTitleNarrow : styles.eventPillTitleMobile),
                  ]}
                  numberOfLines={1}
                >
                  ({ev.title})
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    ...({ backdropFilter: "blur(20px)" } as any),
    gap: 14,
  },
  containerMobile: {
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.brand,
    flexShrink: 1,
  },
  tagLive: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagLiveText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  legendsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  legendsRowMobile: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 14,
    height: 0,
    borderTopWidth: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tooltipBox: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    ...shadows.md,
  },
  tooltipBoxMobile: {
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tooltipLeft: {
    flexDirection: "column",
  },
  tooltipLeftNarrow: {
    minWidth: "100%",
  },
  tooltipMonth: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primaryLight,
    textTransform: "uppercase",
  },
  tooltipCapital: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  tooltipCapitalNarrow: {
    fontSize: 16,
  },
  tooltipRight: {
    flex: 1,
  },
  tooltipDetail: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  tooltipEvents: {
    fontSize: 11,
    color: colors.warningSoft,
    fontWeight: "700",
    marginTop: 2,
  },
  closeTooltipBtn: {
    padding: 4,
  },
  chartWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    overflow: "hidden",
  },
  timelineRow: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  timelineTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  timelineScroll: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  timelineEmpty: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  eventPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  eventPillProject: {
    backgroundColor: colors.warningSoft,
    borderColor: "rgba(217, 119, 6, 0.3)",
  },
  eventPillInflow: {
    backgroundColor: colors.inflowSoft,
    borderColor: "rgba(37, 99, 235, 0.3)",
  },
  eventPillDate: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  eventPillDivider: {
    fontSize: 10,
    color: colors.textMuted,
  },
  eventPillAmount: {
    fontSize: 11,
    fontWeight: "800",
  },
  eventPillTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    maxWidth: 160,
  },
  eventPillTitleMobile: {
    maxWidth: 110,
  },
  eventPillTitleNarrow: {
    maxWidth: 90,
  },
});
