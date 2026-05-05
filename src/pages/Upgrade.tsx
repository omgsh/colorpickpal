import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Pipette } from "lucide-react";

const Upgrade = () => {
  const [params] = useSearchParams();
  const ext = params.get("ext");
  const cancelled = params.get("cancelled");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    if (!ext) {
      setError("Missing install id. Click 'Upgrade to Pro' from inside the extension.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { installId: ext, origin: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (e: any) {
      setError(e?.message || "Could not start checkout");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="container mx-auto flex items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Pipette className="h-5 w-5 text-primary" />
          Color Picker Pro
        </Link>
      </header>

      <section className="container mx-auto max-w-md py-16">
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold">Unlock Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground">One-time payment. Lifetime license.</p>
          <div className="my-6 text-5xl font-bold">$10</div>

          <ul className="mb-6 space-y-2 text-left text-sm">
            <li>✓ Saved palettes</li>
            <li>✓ Export to CSS / SCSS / Tailwind / JSON</li>
            <li>✓ 50-pick history</li>
            <li>✓ No affiliate strip</li>
          </ul>

          {cancelled && (
            <p className="mb-3 text-sm text-amber-600">Checkout cancelled. Try again whenever you're ready.</p>
          )}
          {!ext && (
            <p className="mb-3 text-sm text-amber-600">
              Tip: open this page from the extension's "Upgrade to Pro" button so we can link the
              license to your install.
            </p>
          )}

          <Button onClick={buy} disabled={loading || !ext} className="w-full" size="lg">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting checkout…</> : "Buy Pro — $10"}
          </Button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <p className="mt-6 text-xs text-muted-foreground">
            Secure checkout powered by Stripe. After paying you'll get a license key to paste into
            the extension.
          </p>
        </Card>
      </section>
    </main>
  );
};

export default Upgrade;
