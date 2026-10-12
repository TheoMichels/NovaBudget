import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { formatEuro } from "../../hooks/useForecast";
import { ProjectionForecastResult } from "../../types/projection";

interface SmartRecommendationCardProps {
  forecast: ProjectionForecastResult;
  monthlySavings: number;
}

export function SmartRecommendationCard({
  forecast,
  monthlySavings,
}: SmartRecommendationCardProps) {
  const isSafe = forecast.isHealthy;
  const reqMonthly = forecast.requiredMonthlySavingsForProjects;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Text style={{ fontSize: 16 }}>🧠</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Recommandation Intelligente NovaBudget</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Optimisation</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.bodyText}>
        {isSafe ? (
          <>
            Pour concrétiser vos projets tout en préservant votre socle de sécurité
            de 20 000 €, votre effort d'épargne mensuel minimum est de{" "}
            <Text style={styles.highlight}>{formatEuro(reqMonthly)} / mois</Text>.
            Avec votre rythme actuel de{" "}
            <Text style={styles.highlight}>{formatEuro(monthlySavings)} / mois</Text>,
            vos projets sont{" "}
            <Text style={{ fontWeight: "800", color: "#34D399" }}>
              sécurisés à 100%
            </Text>{" "}
            avec un excédent libre projeté de{" "}
            <Text style={styles.highlight}>
              +{formatEuro(forecast.cushionSurplus)}
            </Text>.
          </>
        ) : (
          <>
            Pour financer l'ensemble de vos projets tout en maintenant votre matelas
            de sécurité, il est conseillé de porter votre épargne mensuelle à au moins{" "}
            <Text style={{ fontWeight: "800", color: "#FCD34D" }}>
              {formatEuro(reqMonthly)} / mois
            </Text>{" "}
            ou de décaler l'échéance de certains projets.
          </>
        )}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerIcon}>💡</Text>
        <Text style={styles.footerText}>
          <Text style={{ fontWeight: "700", color: "#6EE7B7" }}>
            Stratégie d'apport :
          </Text>{" "}
          Lors du décaissement pour vos projets, débloquez en priorité vos livrets
          bancaires (Livret A, LDDS à 3%) afin de laisser fructifier vos supports long
          terme (PEA à 7%, Assurance-Vie).
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6EE7B7",
  },
  tag: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#A7F3D0",
  },
  bodyText: {
    fontSize: 12,
    color: "#E2E8F0",
    lineHeight: 18,
  },
  highlight: {
    fontWeight: "800",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    paddingTop: 10,
  },
  footerIcon: {
    fontSize: 12,
    marginTop: 1,
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 16,
    flex: 1,
  },
});
