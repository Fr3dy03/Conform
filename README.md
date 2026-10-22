# Conform

Conform is a BOT Chain testnet workbench for ERC-4337 conformance. It checks the
network, bundler, EntryPoint, factory, SimpleAccount derivation and funding path,
then walks through a complete UserOperation: estimate, wallet signature, bundler
submission and receipt verification.

The app is intentionally explicit about evidence. A submitted hash is not a
confirmed transaction. A receipt is only accepted when the UserOperation's inner
`success` flag is true and the outer transaction status is successful.

## Requirements

- Node.js 20.9 or newer
- npm
- A browser wallet for the live UserOperation path

## Quick start

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. The console is at
<http://localhost:3000/console>. Use <http://localhost:3000/console?demo=1> to
inspect labelled demo evidence without connecting a wallet or sending a
transaction.

The checked-in defaults point at BOT Chain testnet. `.env.local` is optional, but
it lets you override endpoints and set the public site origin.

## Commands

```powershell
npm run dev        # Next.js development server
npm run build      # production build
npm start          # serve the production build
npm run lint       # ESLint for the web app
npm run typecheck  # TypeScript for all workspaces
npm test           # Vitest unit tests for the chain package
```

## What it checks

- **Network:** chain ID 968, block height, client version and RPC latency.
- **Bundler:** chain ID, EntryPoint support and the required ERC-4337 v0.7
  method surface.
- **Contracts:** EntryPoint v0.7, SimpleAccountFactory, implementation bytecode
  and the factory's implementation lookup.
- **Account:** SimpleAccount derivation, deployment state, EntryPoint nonce and
  gas funding.
- **Sponsorship:** reported as unknown unless a verified EntryPoint v0.7
  paymaster is configured. Configuration alone does not prove a sponsorship
  policy.
- **UserOperation:** fee quote, gas estimate, local `userOpHash`, wallet
  signature, bundler submission, polling and receipt checks.

The result is a stage-by-stage report with readable AA/RPC failure guidance, a
full JSON download, and a compact self-contained share link. Reports exclude
private keys, seed phrases, signatures, raw payloads and endpoint credentials.

## BOT Chain testnet values

| Item | Value |
| --- | --- |
| Network | BOT Chain Testnet |
| Chain ID | 968 (`0x3c8`) |
| RPC | <https://rpc.bohr.life> |
| Bundler | <https://bundler.bohr.life/rpc/> |
| Testnet explorer | <https://scan.bohr.life> |
| Faucet | <https://faucet.botchain.ai/basic> |
| EntryPoint v0.7 | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` |
| SimpleAccountFactory | `0xBC88d6012b3bf8426C2851d3798cEB5257658332` |
| SimpleAccount implementation | `0xDE15Ab00C52FF37eCe01C384eB42C802721db823` |

Official links: [BOT Chain](https://www.botchain.ai/en/),
[explorer](https://scan.botchain.ai),
[developer docs](https://dev-docs.botchain.ai/).

## Architecture

```text
apps/web                 Next.js App Router UI and server-side RPC relays
packages/chain           Network, diagnostics, UserOperation, report logic
packages/ui              Shared React components and footer
contracts                External deployment notes; no local contract source
docs                     UI research, brand rules and manual acceptance steps
```

The browser never receives a provider secret. Calls to the RPC and bundler pass
through same-origin Next.js route handlers with method allowlists, body-size
limits, best-effort rate limiting and upstream timeouts.

## Configuration

All values are server-side. Do not put private keys, seed phrases or provider
API keys in `NEXT_PUBLIC_*` variables.

| Variable | Purpose |
| --- | --- |
| `BOT_TESTNET_RPC_URL` | Testnet JSON-RPC endpoint |
| `BOT_TESTNET_BUNDLER_URL` | Testnet ERC-4337 bundler endpoint |
| `BOT_TESTNET_EXPLORER_URL` | Testnet explorer |
| `BOT_TESTNET_FAUCET_URL` | Testnet faucet |
| `BOT_TESTNET_ENTRYPOINT` | EntryPoint v0.7 address |
| `BOT_TESTNET_SIMPLE_ACCOUNT_FACTORY` | SimpleAccount factory |
| `BOT_TESTNET_SIMPLE_ACCOUNT_IMPLEMENTATION` | SimpleAccount implementation |
| `BOT_TESTNET_PAYMASTER_ADDRESS` | Optional verified paymaster address |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin for links |

## Live UserOperation flow

1. Open `/console` and run diagnostics.
2. Connect an injected wallet on BOT Chain testnet and use that account as the
   SimpleAccount owner.
3. Derive the counterfactual SimpleAccount.
4. Fund the smart-account address with test BOT if the account cannot prefund
   gas. The console also exposes a funding transfer from the connected wallet.
5. Estimate the UserOperation and inspect the local hash.
6. Sign the raw `userOpHash` with the owner wallet.
7. Submit to the bundler and wait for a receipt.

Success is not declared from the submission response. Conform requires a
matching `userOpHash`, `success=true` and a successful outer receipt status.

## Security model

- No private keys, seed phrases or signatures are stored by the app.
- Signatures remain in browser memory for the current submission only.
- Reports and share links omit signatures and raw UserOperation payloads.
- `/report` is `noindex` and is excluded from the sitemap and robots allowlist.
- The RPC relay allowlist is read-oriented; the bundler relay exposes only the
  UserOperation methods required by the console.
- Error text is sanitized before display or export.

## Limitations

- BOT Chain testnet only.
- Bundler checks are a sampled method matrix, not a full ERC-4337 compliance
  suite.
- Sponsorship is not proven without a real sponsored UserOperation.
- EOA Paymaster and EIP-7702 flows are outside the tested path.
- Receipt polling is bounded; a pending operation may need a later lookup.
- A share link is unsigned and can be edited. Use the JSON and explorer links
  when stronger evidence is required.

See [docs/testnet-acceptance.md](docs/testnet-acceptance.md) for the manual
acceptance checklist and [docs/brand.md](docs/brand.md) for brand usage.
