import { CplCalculator } from "@/components/calculators/cpl-calculator";
import { PrerequisitesChecklist } from "@/components/calculators/prerequisites-checklist";

export default function CalculadorasPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calculadoras</h1>
        <p className="text-muted-foreground">Ferramentas para planejar campanhas dos clientes.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <CplCalculator />
        <PrerequisitesChecklist />
      </div>
    </div>
  );
}
