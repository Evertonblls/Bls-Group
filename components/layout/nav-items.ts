import {
  LayoutDashboard,
  Users,
  ListChecks,
  ClipboardList,
  FileBarChart,
  Target,
  Palette,
  Wallet,
  Calculator,
  type LucideIcon,
} from "lucide-react";
import type { ModuleName } from "@/lib/permissions";

export type NavItem = {
  module: ModuleName;
  label: string;
  href: string;
  icon: LucideIcon;
  implemented: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    module: "dashboard",
    label: "Início",
    href: "/dashboard",
    icon: LayoutDashboard,
    implemented: true,
  },
  {
    module: "clientes",
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    implemented: true,
  },
  {
    module: "onboarding",
    label: "Onboarding",
    href: "/onboarding",
    icon: ListChecks,
    implemented: true,
  },
  {
    module: "tarefas",
    label: "Tarefas",
    href: "/tarefas",
    icon: ClipboardList,
    implemented: true,
  },
  {
    module: "relatorios",
    label: "Relatórios",
    href: "/relatorios",
    icon: FileBarChart,
    implemented: true,
  },
  {
    module: "metas",
    label: "Metas",
    href: "/metas",
    icon: Target,
    implemented: true,
  },
  {
    module: "criativos",
    label: "Criativos",
    href: "/criativos",
    icon: Palette,
    implemented: true,
  },
  {
    module: "financeiro",
    label: "Financeiro",
    href: "/financeiro",
    icon: Wallet,
    implemented: true,
  },
  {
    module: "calculadoras",
    label: "Calculadoras",
    href: "/calculadoras",
    icon: Calculator,
    implemented: true,
  },
];
