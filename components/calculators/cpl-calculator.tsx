"use client";

import { useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CPL_EXAMPLE, calculateCpl, type CplInputs } from "@/lib/calculators/cpl";

type FieldKey = keyof CplInputs;

const FIELDS: { key: FieldKey; label: string; suffix: "R$" | "%"; hint?: string }[] = [
  { key: "ticket", label: "Ticket médio do produto", suffix: "R$" },
  { key: "productCost", label: "Custo do produto + comissão de venda", suffix: "R$" },
  {
    key: "cpaPercent",
    label: "% de CPA sobre o lucro bruto",
    suffix: "%",
    hint: "Negócio local geralmente fica entre 20% e 30% do lucro bruto",
  },
  { key: "conversionPercent", label: "Taxa de conversão de lead em venda", suffix: "%" },
  { key: "currentRevenue", label: "Faturamento atual", suffix: "R$" },
  { key: "targetRevenue", label: "Faturamento desejado", suffix: "R$" },
];

const EMPTY: Record<FieldKey, string> = {
  ticket: "",
  productCost: "",
  cpaPercent: "20",
  conversionPercent: "10",
  currentRevenue: "",
  targetRevenue: "",
};

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const int = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

function parse(value: string) {
  // Aceita "1.234,56" e "1234.56".
  const normalized = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
  return normalized.trim() === "" ? NaN : Number(normalized);
}

export function CplCalculator() {
  const [values, setValues] = useState(EMPTY);

  const result = calculateCpl(
    Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, parse(v)])
    ) as CplInputs
  );

  function loadExample() {
    setValues(
      Object.fromEntries(
        Object.entries(CPL_EXAMPLE).map(([k, v]) => [k, String(v)])
      ) as Record<FieldKey, string>
    );
  }

  const outputs = result
    ? [
        { label: "Lucro bruto", value: brl.format(result.grossProfit) },
        { label: "CPA ideal", value: brl.format(result.idealCpa) },
        { label: "CPL ideal", value: brl.format(result.idealCpl), highlight: true },
        { label: "Vendas adicionais", value: int.format(Math.ceil(result.additionalSales)) },
        { label: "Leads necessários", value: int.format(Math.ceil(result.requiredLeads)) },
        {
          label: "Investimento necessário",
          value: brl.format(result.requiredInvestment),
          highlight: true,
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>CPL Ideal / Matemática do ROI</CardTitle>
            <CardDescription>
              Descubra quanto pagar por lead e quanto investir para bater a meta.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setValues(EMPTY)}>
              <RotateCcw />
              Limpar
            </Button>
            <Button size="sm" onClick={loadExample}>
              <Sparkles />
              Carregar exemplo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <Label htmlFor={`cpl-${field.key}`}>
                {field.label} ({field.suffix})
              </Label>
              <Input
                id={`cpl-${field.key}`}
                inputMode="decimal"
                value={values[field.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
              {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {result ? (
            <div className="grid grid-cols-2 gap-3">
              {outputs.map((item) => (
                <div
                  key={item.label}
                  className={
                    item.highlight
                      ? "rounded-lg border border-primary bg-primary/10 p-3"
                      : "rounded-lg border p-3"
                  }
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p
                    className={
                      item.highlight
                        ? "text-xl font-semibold text-primary"
                        : "text-xl font-semibold"
                    }
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Preencha todos os campos (ou clique em &quot;Carregar exemplo&quot;) para ver o
              resultado.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Lucro bruto = ticket − custo · CPA = lucro bruto × % de CPA · CPL = CPA × conversão ·
            Vendas = (desejado − atual) ÷ ticket · Leads = vendas ÷ conversão · Investimento =
            vendas × CPA
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
