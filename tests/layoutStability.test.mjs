import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Fonctions pures de logique d'affichage et de contrat UI testées
function formatEuro(amount) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getGainsPillData(accumulatedInterest = 0, inflows = 0) {
  const hasPositiveGains = accumulatedInterest > 0 || inflows > 0;
  if (!hasPositiveGains) {
    return {
      hasPositiveGains: false,
      neutralLabel: "0 € de gains à date",
    };
  }
  return {
    hasPositiveGains: true,
    interestText: accumulatedInterest > 0 ? `+${formatEuro(accumulatedInterest)} intérêts` : null,
    inflowsText: inflows > 0 ? `+${formatEuro(inflows)} rentrées` : null,
  };
}

function getChartDiffBadgeData(selectedIndex, currentCapital, baseCapital, isNarrow = false) {
  if (selectedIndex === 0) {
    return {
      isBasePoint: true,
      label: "Point de départ",
      isPositive: true,
    };
  }
  const capitalDiff = currentCapital - baseCapital;
  const capitalDiffPct = baseCapital > 0 ? ((capitalDiff / baseCapital) * 100).toFixed(1) : "0.0";
  const isPositive = capitalDiff >= 0;
  const sign = isPositive ? "+" : "";

  // Sur écran étroit (< 400px), format compact pour éviter le wrapping
  const label = isNarrow
    ? `${sign}${capitalDiffPct}%`
    : `${sign}${formatEuro(capitalDiff)} (${sign}${capitalDiffPct}%)`;

  return {
    isBasePoint: false,
    label,
    isPositive,
    capitalDiff,
    capitalDiffPct,
  };
}

describe("Contrat de Stabilité Visuelle - Section Épargne Projetée", () => {
  it("Mois d'aujourd'hui (index 0) : doit retourner la pastille neutre '0 € de gains à date'", () => {
    const data = getGainsPillData(0, 0);
    assert.equal(data.hasPositiveGains, false);
    assert.equal(data.neutralLabel, "0 € de gains à date");
  });

  it("Mois futur avec intérêts : doit afficher le montant des intérêts", () => {
    const data = getGainsPillData(450, 0);
    assert.equal(data.hasPositiveGains, true);
    assert.match(data.interestText, /\+450\s*€\s*intérêts/);
    assert.equal(data.inflowsText, null);
  });

  it("Mois futur avec intérêts et rentrées : doit afficher les deux pastilles", () => {
    const data = getGainsPillData(320, 2500);
    assert.equal(data.hasPositiveGains, true);
    assert.match(data.interestText, /\+320\s*€\s*intérêts/);
    assert.match(data.inflowsText, /\+2\s*500\s*€\s*rentrées/);
  });
});

describe("Contrat de Stabilité Visuelle - En-tête du Graphe", () => {
  it("Index 0 (Point de départ) : doit afficher le badge neutre 'Point de départ'", () => {
    const badge = getChartDiffBadgeData(0, 10000, 10000, false);
    assert.equal(badge.isBasePoint, true);
    assert.equal(badge.label, "Point de départ");
  });

  it("Index > 0 (desktop/standard) : doit afficher la différence en euro et le pourcentage", () => {
    const badge = getChartDiffBadgeData(12, 12500, 10000, false);
    assert.equal(badge.isBasePoint, false);
    assert.equal(badge.isPositive, true);
    assert.match(badge.label, /\+2\s*500\s*€\s*\(\+25\.0%\)/);
  });

  it("Index > 0 sur mobile étroit : doit formater le badge de façon compacte (+25.0%)", () => {
    const badge = getChartDiffBadgeData(12, 12500, 10000, true);
    assert.equal(badge.isBasePoint, false);
    assert.equal(badge.label, "+25.0%");
  });

  it("Garantie anti-wrapping Safari : flexWrap doit être 'nowrap'", () => {
    const cardHeaderStyle = {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      flexWrap: "nowrap",
    };
    assert.equal(cardHeaderStyle.flexWrap, "nowrap");
  });
});
