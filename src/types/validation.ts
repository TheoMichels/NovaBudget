import { z } from "zod";

export const moneySchema = z.number().finite().nonnegative();
const label = z.string().trim().min(1);
const date = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/);
export const expenseInputSchema = z.object({
  title: label, amount: moneySchema, targetDate: date,
  category: z.enum(["voyage", "logement", "vehicule", "famille", "fiscalite", "autre"]),
  isActive: z.boolean(), notes: z.string().optional(),
});
export const expenseSchema = expenseInputSchema.extend({ id: label, updatedAt: z.string().default("") });
export const inflowInputSchema = expenseInputSchema.omit({ category: true });
export const inflowSchema = inflowInputSchema.extend({ id: label, updatedAt: z.string().default("") });
export const savingsInputSchema = z.object({
  name: label, category: z.enum(["securite", "projet", "investissement"]),
  amount: moneySchema, rate: z.number().finite(), bank: z.string().optional(), notes: z.string().optional(),
});
export const savingsSchema = savingsInputSchema.extend({ id: label, updatedAt: z.string().default("") });
export const contributionSchema = z.object({ monthlyTotal: moneySchema });
const remoteNumber = z.union([z.number(), z.string().regex(/^-?\d+(?:\.\d+)?$/)]).transform(Number).pipe(z.number().finite());
export const remoteExpenseSchema = z.object({
  id: label, title: label, amount: remoteNumber.pipe(moneySchema), target_date: date,
  category: expenseInputSchema.shape.category, is_active: z.boolean(),
  notes: z.string().nullable().optional(), updated_at: z.string().optional(),
});
export const remoteInflowSchema = remoteExpenseSchema.omit({ category: true });
export const remoteSavingsSchema = z.object({
  id: label, name: label, category: savingsInputSchema.shape.category,
  amount: remoteNumber.pipe(moneySchema), rate: remoteNumber,
  bank: z.string().nullable().optional(), notes: z.string().nullable().optional(), updated_at: z.string().optional(),
});
export const remoteSettingsSchema = z.object({
  safety_cushion: remoteNumber.pipe(moneySchema).nullable().optional(),
  monthly_savings: remoteNumber.pipe(moneySchema).nullable().optional(),
});
export function validate<S extends z.ZodTypeAny>(schema: S, value: unknown): z.output<S> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error("Valeurs invalides. Vérifiez les champs et les montants saisis.");
  return parsed.data;
}
export function parseFrenchNumber(value: string): number {
  const normalized = value.trim().replace(/[\s\u202f\u00a0]/g, "").replace(",", ".");
  return /^-?\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

export const credentialsSchema = z.object({ email: z.string().trim().email(), password: z.string().min(6) });
