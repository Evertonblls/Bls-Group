import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingKanban } from "@/components/onboarding/onboarding-kanban";
import { ClientFormLink } from "@/components/onboarding/client-form-link";
import { requireProfile } from "@/lib/auth/session";
import { getCardsForKanban, getStages } from "@/lib/onboarding/queries";
import { getClientFormUrl } from "@/lib/settings/queries";

export default async function OnboardingPage() {
  const [profile, stages, cards, clientFormUrl] = await Promise.all([
    requireProfile(),
    getStages(),
    getCardsForKanban(),
    getClientFormUrl(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
          <p className="text-muted-foreground">
            Acompanhamento dos clientes em processo de ativação.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/onboarding/etapas" />}
          >
            <Settings />
            Etapas
          </Button>
          <Button nativeButton={false} render={<Link href="/onboarding/novo" />}>
            <Plus />
            Novo onboarding
          </Button>
        </div>
      </div>

      <ClientFormLink
        url={clientFormUrl}
        canEdit={profile.role === "admin" || profile.role === "colaborador"}
      />

      {stages.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma etapa configurada ainda. Vá em &quot;Etapas&quot; para criar a primeira.
        </p>
      ) : (
        <OnboardingKanban stages={stages} cards={cards} />
      )}
    </div>
  );
}
