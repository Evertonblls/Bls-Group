import type { UserRole } from "@/lib/types/database";

export const MODULES = [
  "dashboard",
  "clientes",
  "onboarding",
  "tarefas",
  "relatorios",
  "metas",
  "criativos",
  "financeiro",
  "calculadoras",
] as const;

export type ModuleName = (typeof MODULES)[number];

// admin enxerga e edita tudo. Os demais papéis ganham acesso conforme os
// módulos forem implementados nas fases seguintes — hoje, com um usuário só
// (admin), isso não bloqueia nada.
const MODULE_ACCESS: Record<ModuleName, UserRole[]> = {
  dashboard: ["admin", "colaborador", "financeiro"],
  clientes: ["admin", "colaborador", "financeiro"],
  onboarding: ["admin", "colaborador"],
  tarefas: ["admin", "colaborador"],
  relatorios: ["admin", "colaborador"],
  metas: ["admin", "colaborador", "financeiro"],
  criativos: ["admin", "colaborador"],
  financeiro: ["admin", "financeiro"],
  calculadoras: ["admin", "colaborador"],
};

export function canAccessModule(role: UserRole, module: ModuleName) {
  return MODULE_ACCESS[module].includes(role);
}
