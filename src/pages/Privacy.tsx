import { Pipette } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto flex items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Pipette className="h-5 w-5 text-primary" />
          Color Pick Pal
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Home
        </Link>
      </header>

      <article className="container mx-auto max-w-2xl py-12 prose prose-slate dark:prose-invert">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: May 5, 2026</p>

        <p className="mt-6">
          Color Pick Pal ("the extension") is a Chrome browser extension that lets you pick
          colors from anywhere on your screen using the native EyeDropper API. This policy
          explains exactly what data the extension handles.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">Data we collect</h2>
        <p>
          <strong>None.</strong> The extension does not collect, transmit, sell, or share any
          personal information. There are no analytics, no tracking, no telemetry, and no
          remote servers contacted by the extension during normal use.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">Data stored locally on your device</h2>
        <ul className="list-disc pl-6">
          <li>
            <strong>Color history</strong> — recently picked colors (HEX values) are stored in
            <code> chrome.storage.local</code> so they persist between popup sessions.
          </li>
          <li>
            <strong>Saved palettes</strong> (Pro) — palette names and the colors you add to them.
          </li>
          <li>
            <strong>Preferences</strong> — your selected output format (HEX/RGB/HSL/CMYK).
          </li>
          <li>
            <strong>Pro license status</strong> — a cached flag indicating whether you have
            purchased Pro, used to unlock features in the popup.
          </li>
        </ul>
        <p>
          All of this data lives only on your device. Uninstalling the extension removes it.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">Permissions and why we use them</h2>
        <ul className="list-disc pl-6">
          <li>
            <code>storage</code> — to save your color history, palettes, and preferences locally.
          </li>
          <li>
            <code>clipboardWrite</code> — to auto-copy a picked color value to your clipboard.
          </li>
          <li>
            <code>host_permissions: extensionpay.com</code> — used only by the optional Pro
            upgrade flow to verify your purchase. No browsing data is sent to this host.
          </li>
        </ul>

        <h2 className="mt-8 text-2xl font-semibold">Picked colors</h2>
        <p>
          When you click "Pick Color", Chrome's built-in EyeDropper returns the pixel color you
          select. The extension reads only that single color value. No screenshots, page
          contents, URLs, or other browsing data are accessed or transmitted.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">Pro purchases</h2>
        <p>
          If you upgrade to Pro, payment is processed by{" "}
          <a href="https://extensionpay.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            ExtensionPay
          </a>
          , a third-party service that handles the transaction via Stripe. We never see or
          store your payment details. ExtensionPay's privacy policy applies to that flow.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">Affiliate links</h2>
        <p>
          The free version displays a small set of affiliate links to design tools and color
          resources. Clicking one opens the destination in a new tab. We may earn a small
          commission if you make a purchase. No personal data is shared with these partners by
          the extension itself; only the standard HTTP request your browser makes when
          following the link.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">Children</h2>
        <p>
          The extension is not directed at children under 13 and does not knowingly collect
          information from anyone.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">Changes to this policy</h2>
        <p>
          If this policy changes, the "Last updated" date above will be revised. Material
          changes will be noted at the top of the page.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">Contact</h2>
        <p>
          Questions about privacy? Open an issue on the project page or reach out via the
          support link in the Chrome Web Store listing.
        </p>
      </article>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Color Pick Pal · Built with the native EyeDropper API
      </footer>
    </main>
  );
};

export default Privacy;
