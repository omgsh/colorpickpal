// Public endpoint called by the Chrome extension.
// Returns { valid: boolean } for a given license key + install id.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { licenseKey, installId } = await req.json();
    if (!licenseKey) return json({ valid: false, error: "licenseKey required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("licenses")
      .select("install_id, license_key")
      .eq("license_key", licenseKey)
      .maybeSingle();

    if (error) throw error;
    if (!data) return json({ valid: false });

    // First activation: bind to this install id (re-bind if user reinstalls).
    if (installId && data.install_id !== installId) {
      await supabase
        .from("licenses")
        .update({ install_id: installId })
        .eq("license_key", licenseKey);
    }

    return json({ valid: true });
  } catch (e) {
    console.error("verify-license error", e);
    return json({ valid: false, error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
