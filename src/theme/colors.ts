export const gradient = {
  // Soothing, light, neutral white & soft sage/emerald gradient
  colors: ["#F6FAF8", "#EDF7F2", "#F3F9F6", "#E8F5EE"] as const,
  locations: [0, 0.35, 0.7, 1] as const,
  start: { x: 0.0, y: 0.0 },
  end: { x: 1.0, y: 1.0 },
};

export const colors = {
  // Brand & Greens
  brand: "#0F2922",
  brandMuted: "#1E473B",
  primary: "#059669",
  primaryLight: "#10B981",
  primarySoft: "#D1FAE5",
  primaryBackground: "#ECFDF5",

  // Text
  textPrimary: "#0C231B",
  textSecondary: "#40594E",
  textMuted: "#738E83",
  textOnBrand: "#FFFFFF",

  // Glassmorphic surfaces & panels
  panel: "rgba(255, 255, 255, 0.82)",
  panelSubtle: "rgba(255, 255, 255, 0.60)",
  surface: "rgba(255, 255, 255, 0.90)",
  surfaceActive: "#FFFFFF",
  border: "rgba(230, 243, 238, 0.85)",
  borderStrong: "rgba(16, 185, 129, 0.30)",
  divider: "rgba(209, 232, 222, 0.5)",

  // Status & Highlights
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  positive: "#059669",
  positiveSoft: "#D1FAE5",

  // Inflow & Accent
  inflow: "#2563EB",
  inflowSoft: "#DBEAFE",

  backdrop: "rgba(15, 41, 34, 0.25)",
};

export const shadows = {
  sm: {
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },
  lg: {
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 24 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
