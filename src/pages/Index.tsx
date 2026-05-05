import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pipette, Check, Download } from "lucide-react";

const Index = () => {
  const handleDownload = () => {
    fetch("/color-pick-pal.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "color-pick-pal.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => alert(err.message));
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-semibold">
          <Pipette className="h-5 w-5 text-primary" />
          Color Pick Pal
        </div>
        <a href="#install" className="text-sm text-muted-foreground hover:text-foreground">
          Install
        </a>
      </header>

      <section className="container mx-auto grid gap-12 py-16 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-5xl font-bold tracking-tight lg:text-6xl">
            Pick any color.<br />
            <span className="text-primary">Anywhere on screen.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            A minimalist Chrome extension powered by the native EyeDropper API. Auto-copies the
            value in your chosen format. Free forever. Pro adds palettes, all color formats,
            complementary suggestions and code export.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download Extension
            </Button>
            <a href="#pricing">
              <Button size="lg" variant="outline">See Pro features</Button>
            </a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Works in Chrome, Edge, Brave, Arc — any Chromium browser 95+.
          </p>
        </div>

        <Card className="p-6">
          <div className="rounded-lg bg-muted/40 p-6">
            <div className="mx-auto w-[280px] rounded-xl border bg-background p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Color Pick Pal</span>
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">PRO</span>
              </div>
              <div className="h-20 rounded-lg" style={{ background: "linear-gradient(135deg,#6366f1,#ec4899)" }} />
              <div className="mt-3 font-mono text-base font-semibold">#6366F1</div>
              <Button className="mt-3 w-full" size="sm">Pick Color</Button>
              <div className="mt-4 flex gap-1.5">
                {["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6"].map((c) => (
                  <div key={c} className="h-7 w-7 rounded-md border" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="pricing" className="container mx-auto py-16">
        <h2 className="mb-10 text-center text-3xl font-bold">Free vs Pro</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-1 text-lg font-semibold">Free</h3>
            <p className="mb-4 text-sm text-muted-foreground">Everything you need to pick & copy.</p>
            <ul className="space-y-2 text-sm">
              {[
                "Native EyeDropper picker",
                "Auto-copy in HEX or RGB",
                "Last 5 picks history",
                "Affiliate design resources",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>
              ))}
            </ul>
          </Card>
          <Card className="border-amber-300 p-6">
            <h3 className="mb-1 text-lg font-semibold">Pro <span className="ml-2 text-sm font-normal text-amber-600">$10 once</span></h3>
            <p className="mb-4 text-sm text-muted-foreground">For designers & developers.</p>
            <ul className="space-y-2 text-sm">
              {[
                "Everything in Free",
                "All formats: HEX, RGB, HSL, CMYK",
                "Complementary palette generator",
                "Saved palettes",
                "Export to CSS / SCSS / Tailwind / JSON",
                "50-pick history",
                "No affiliate strip",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-600" />{f}</li>
              ))}
            </ul>
            <p className="mt-5 text-center text-xs text-muted-foreground">
              Upgrade from inside the extension — secure checkout via ExtensionPay.
            </p>
          </Card>
        </div>
      </section>

      <section id="install" className="container mx-auto py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Install in 4 steps</h2>
        <ol className="mx-auto max-w-xl space-y-4 text-sm">
          {[
            "Download the .zip and unzip it.",
            "Open chrome://extensions in Chrome (or any Chromium browser).",
            "Toggle Developer mode in the top-right corner.",
            'Click "Load unpacked" and select the unzipped folder.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 rounded-lg border p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">{i + 1}</span>
              <span className="self-center">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Color Pick Pal · Built with the native EyeDropper API
      </footer>
    </main>
  );
};

export default Index;
