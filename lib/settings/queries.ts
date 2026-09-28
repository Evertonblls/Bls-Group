import { createClient } from "@/lib/supabase/server";
import { CLIENT_FORM_URL_KEY, DEFAULT_CLIENT_FORM_URL } from "@/lib/settings/types";

export async function getClientFormUrl(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", CLIENT_FORM_URL_KEY)
    .maybeSingle();

  return data?.value || DEFAULT_CLIENT_FORM_URL;
}
