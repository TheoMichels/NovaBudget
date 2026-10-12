export interface MonthItem {
  month: number; // 1 to 12
  key: string; // "01" to "12"
  short: string;
  name: string;
}

export const MONTHS_FR: MonthItem[] = [
  { month: 1, key: "01", short: "Janv.", name: "Janvier" },
  { month: 2, key: "02", short: "Févr.", name: "Février" },
  { month: 3, key: "03", short: "Mars", name: "Mars" },
  { month: 4, key: "04", short: "Avr.", name: "Avril" },
  { month: 5, key: "05", short: "Mai", name: "Mai" },
  { month: 6, key: "06", short: "Juin", name: "Juin" },
  { month: 7, key: "07", short: "Juil.", name: "Juillet" },
  { month: 8, key: "08", short: "Août", name: "Août" },
  { month: 9, key: "09", short: "Sept.", name: "Septembre" },
  { month: 10, key: "10", short: "Oct.", name: "Octobre" },
  { month: 11, key: "11", short: "Nov.", name: "Novembre" },
  { month: 12, key: "12", short: "Déc.", name: "Décembre" },
];

/**
 * Parses a "YYYY-MM" string into { year, month (1-12) }.
 * Falls back to current date if missing or invalid.
 */
export function parseYearMonth(dateStr?: string): { year: number; month: number } {
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  if (!dateStr || typeof dateStr !== "string") {
    return { year: defaultYear, month: defaultMonth };
  }

  const parts = dateStr.trim().split("-");
  if (parts.length < 2) {
    return { year: defaultYear, month: defaultMonth };
  }

  const parsedYear = parseInt(parts[0], 10);
  const parsedMonth = parseInt(parts[1], 10);

  const year = isNaN(parsedYear) ? defaultYear : parsedYear;
  const month = isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12 ? defaultMonth : parsedMonth;

  return { year, month };
}

/**
 * Formats year and month into "YYYY-MM" string.
 */
export function toYearMonthString(year: number, month: number): string {
  const m = Math.max(1, Math.min(12, month));
  return `${year}-${String(m).padStart(2, "0")}`;
}

/**
 * Formats a "YYYY-MM" string into French readable string, e.g. "Août 2026" or "Août 2026".
 */
export function formatFrenchMonthYear(
  dateStr?: string,
  variant: "full" | "short" = "full"
): string {
  if (!dateStr) return "";
  const { year, month } = parseYearMonth(dateStr);
  const item = MONTHS_FR[month - 1];
  if (!item) return dateStr;
  const monthLabel = variant === "short" ? item.short : item.name;
  return `${monthLabel} ${year}`;
}

/**
 * Calculates human-readable relative description from current month/year.
 * e.g. "Ce mois-ci", "Dans 2 mois", "Dans 1 an", "Il y a 3 mois".
 */
export function getRelativeMonthDescription(dateStr?: string): string {
  if (!dateStr) return "";
  const { year, month } = parseYearMonth(dateStr);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const diffMonths = (year - currentYear) * 12 + (month - currentMonth);

  if (diffMonths === 0) return "Ce mois-ci";
  if (diffMonths === 1) return "Dans 1 mois";
  if (diffMonths > 1 && diffMonths < 12) return `Dans ${diffMonths} mois`;
  if (diffMonths === 12) return "Dans 1 an";
  if (diffMonths > 12) {
    const years = Math.floor(diffMonths / 12);
    const remMonths = diffMonths % 12;
    if (remMonths === 0) return `Dans ${years} an${years > 1 ? "s" : ""}`;
    return `Dans ${years} an${years > 1 ? "s" : ""} et ${remMonths} m.`;
  }
  if (diffMonths === -1) return "Le mois dernier";
  if (diffMonths < -1) return `Il y a ${Math.abs(diffMonths)} mois`;
  return "";
}
