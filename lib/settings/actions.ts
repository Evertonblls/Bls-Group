"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CLIENT_FORM_URL_KEY } from "@/lib/settings/types";

const urlSchema = z.string().trim().url("Informe um link válido (começando com https://).");

export async function updateClientFormUrl(url: string): Promise<{ error?: string }> {
  const parsed = urlSchema.safeParse(url);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Link inválido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .update({ value: parsed.data, updated_at: new Date().toISOString() })
    .eq("key", CLIENT_FORM_URL_KEY)
    .select("key");

  if (error || !data?.length) {
    return { error: "Não foi possível salvar o link." };
  }

  revalidatePath("/onboarding");
  return {};
}
