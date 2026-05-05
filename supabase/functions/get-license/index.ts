// Called from the success page. Verifies the Stripe session is paid,
// then issues (or returns) a license key for that session.

import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId } = await req.json();
    if (!sessionId) return json({ error: "sessionId required" }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-11-20.acacia",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return json({ error: "Payment not completed" }, 402);
    }

    const installId = session.metadata?.install_id;
    if (!installId) return json({ error: "Missing install_id metadata" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Already issued?
    const { data: existing } = await supabase
      .from("licenses")
      .select("license_key")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existing) {
      return json({ licenseKey: existing.license_key });
    }

    const licenseKey = generateKey();
    const { error } = await supabase.from("licenses").insert({
      install_id: installId,
      license_key: licenseKey,
      stripe_session_id: sessionId,
      email: session.customer_details?.email ?? null,
    });
    if (error) throw error;

    return json({ licenseKey });
  } catch (e) {
    console.error("get-license error", e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

function generateKey() {
  // CPP-XXXX-XXXX-XXXX (uppercase alphanumeric, no ambiguous chars)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const chunk = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `CPP-${chunk()}-${chunk()}-${chunk()}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
