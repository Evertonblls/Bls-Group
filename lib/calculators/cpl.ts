// Matemática do ROI: do ticket médio ao CPL ideal e ao investimento necessário.
// Percentuais entram como número de 0 a 100 (ex.: 20 para 20%).

export type CplInputs = {
  ticket: number;
  productCost: number;
  cpaPercent: number;
  conversionPercent: number;
  currentRevenue: number;
  targetRevenue: number;
};

export type CplResult = {
  grossProfit: number;
  idealCpa: number;
  idealCpl: number;
  additionalSales: number;
  requiredInvestment: number;
  requiredLeads: number;
};

export const CPL_EXAMPLE: CplInputs = {
  ticket: 500,
  productCost: 200,
  cpaPercent: 20,
  conversionPercent: 10,
  currentRevenue: 50000,
  targetRevenue: 100000,
};

export const CPL_PREREQUISITES = [
  "Meta de faturamento",
  "Faturamento atual",
  "Produtos que serão vendidos",
  "Ticket médio",
  "Margem de lucro",
  "Investimento",
] as const;

export function calculateCpl(input: CplInputs): CplResult | null {
  const { ticket, productCost, cpaPercent, conversionPercent, currentRevenue, targetRevenue } =
    input;
  const values = Object.values(input);
  if (values.some((v) => !Number.isFinite(v))) return null;
  if (ticket <= 0 || conversionPercent <= 0) return null;

  const grossProfit = ticket - productCost;
  const idealCpa = grossProfit * (cpaPercent / 100);
  const idealCpl = idealCpa * (conversionPercent / 100);
  const additionalSales = Math.max(0, (targetRevenue - currentRevenue) / ticket);
  const requiredInvestment = additionalSales * idealCpa;
  const requiredLeads = additionalSales / (conversionPercent / 100);

  return {
    grossProfit,
    idealCpa,
    idealCpl,
    additionalSales,
    requiredInvestment,
    requiredLeads,
  };
}
