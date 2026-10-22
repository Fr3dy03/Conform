import { ConformLogo, BotChainLogo } from "./Logos";
import { cn } from "./cn";

const officialLinks = [
  { label: "BOT Chain", href: "https://www.botchain.ai/en/" },
  { label: "BOT Chain Explorer", href: "https://scan.botchain.ai" },
  { label: "Developer Docs", href: "https://dev-docs.botchain.ai/" },
];

const productLinks = [
  { label: "Home", href: "/" },
  { label: "Console", href: "/console" },
  { label: "Demo run", href: "/console?demo=1" },
  { label: "Methodology", href: "/#method" },
];

export function BotChainFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-line bg-[#070a08]", className)}>
      <div className="mx-auto w-full max-w-[1320px] px-5 pb-7 pt-10 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
          <div>
            <ConformLogo />
            <p className="mt-4 max-w-xs text-[12px] leading-5 text-muted">
              ERC-4337 checks for teams deploying smart accounts on BOT Chain
              testnet. Results include evidence and stated limits.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded border border-line bg-white/[0.025] px-2.5 py-1.5">
              <span className="size-1.5 rounded-full bg-lime" />
              <span className="font-mono text-[9.5px] uppercase tracking-[0.09em] text-muted">
                Chain 968 · EntryPoint v0.7
              </span>
            </div>
          </div>

          <div>
            <h2 className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-paper/70">
              Conform
            </h2>
            <ul className="mt-3.5 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-[12px] text-muted transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-paper/70">
              Official BOT Chain
            </h2>
            <ul className="mt-3.5 space-y-2.5">
              {officialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[12px] text-muted transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime"
                  >
                    {link.label}
                    <span aria-hidden="true" className="ml-1 text-[9px]">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <a
              href="https://www.botchain.ai/en/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
              aria-label="BOT Chain official website"
            >
              <BotChainLogo className="h-8 w-auto" />
            </a>
            <p className="mt-4 max-w-xs text-[11px] leading-4.5 text-muted">
              Conform is an independent developer tool, not a BOT Chain
              product or endorsement.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted/80">
            Testnet only · No key custody · Receipt required before success
          </p>
          <p className="text-[10.5px] text-muted/70">
            © {new Date().getFullYear()} Conform. BOT Chain is a trademark of
            its respective owner.
          </p>
        </div>
      </div>
    </footer>
  );
}
