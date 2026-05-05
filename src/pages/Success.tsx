import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Pipette, Check, Copy } from "lucide-react";

const Success = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session id");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-license", {
          body: { sessionId },
        });
        if (error) throw error;
        if (data?.licenseKey) setLicenseKey(data.licenseKey);
        else throw new Error(data?.error || "No license returned");
      } catch (e: any) {
        setError(e?.message || "Failed to issue license");
      }
    })();
  }, [sessionId]);

  const copy = async () => {
    if (!licenseKey) return;
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">You're Pro! 🎉</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here's your lifetime license key. Save it somewhere safe.
          </p>

          <div className="my-6">
            {licenseKey ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
                <code className="flex-1 text-left font-mono text-sm">{licenseKey}</code>
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Issuing license…
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4 text-left text-sm">
            <strong className="mb-2 block">How to activate</strong>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Open the Color Picker extension in your browser.</li>
              <li>Click "Already have a license key?" at the bottom.</li>
              <li>Paste the key and hit Activate.</li>
            </ol>
          </div>
        </Card>
      </section>
    </main>
  );
};

export default Success;
