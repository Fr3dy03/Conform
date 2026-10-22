# BOT Chain testnet acceptance

Use this checklist before treating a build as ready. Run it against the
production build, not only the development server.

## Preconditions

- Node.js 20.9 or newer and npm are installed.
- The repository dependencies are installed with `npm install`.
- Optional: `.env.local` points at independently verified testnet endpoints.
- For the live path: a browser wallet on BOT Chain Testnet (chain ID 968) with
  enough test BOT to fund the SimpleAccount and pay the funding transfer.
- Never use a mainnet key or a key holding real assets.

## Automated gate

```powershell
npm run typecheck
npm test
npm run lint
npm run build
npm start
```

Expected:

- Typecheck exits with no errors in all three workspaces.
- Vitest reports 19 passing tests.
- ESLint reports no errors or warnings.
- The production build lists `/`, `/console`, `/report`, `/api/rpc`,
  `/api/bundler`, `/robots.txt`, `/sitemap.xml` and `/manifest.webmanifest`.
- `npm start` serves on <http://localhost:3000>.

## Demo route

1. Open <http://localhost:3000/console?demo=1>.
2. Confirm the page is visibly labelled as demo evidence.
3. Confirm no wallet connection is requested and no transaction is broadcast.
4. Confirm diagnostics, bundler, contracts, account, sponsorship and
   UserOperation sections contain demo values.
5. Generate a share link and open it.
6. Confirm `/report` shows a demo summary, a warning that the URL is
   unsigned, and no signature, raw payload or endpoint credential.
7. Download the JSON and inspect it for the same exclusions.

## Live diagnostics

1. Open <http://localhost:3000/console> without `demo=1`.
2. Confirm the displayed network is BOT Chain Testnet, chain ID 968.
3. Run diagnostics.
4. Confirm the RPC reports chain ID `0x3c8` and a recent block height.
5. Confirm the bundler reports chain ID 968 and lists EntryPoint v0.7
   `0x0000000071727De22E5E9d8BAf0edAc6f37da032`.
6. Confirm required bundler methods are present or receive a clear failure.
7. Confirm EntryPoint, factory and implementation are deployed.
8. Confirm the SimpleAccount derivation is deterministic for the chosen owner.
9. Confirm sponsorship remains **unknown** unless a verified paymaster was
   intentionally configured. A configured address alone is not proof.

## Live UserOperation

1. Connect the owner wallet and confirm the wallet is on chain 968.
2. Derive the SimpleAccount and record its address.
3. If the account cannot prefund gas, send test BOT to the smart account using
   the funding action, then wait for the funding receipt.
4. Estimate the UserOperation and confirm all gas fields are present.
5. Sign the raw `userOpHash` in the wallet.
6. Submit to the bundler.
7. Confirm the UI shows submitted/pending rather than success immediately.
8. Wait for the receipt. Accept success only when:
   - the returned `userOpHash` matches the submitted hash,
   - the inner UserOperation `success` flag is true,
   - the outer transaction status is successful.
9. Open the transaction in the testnet explorer and compare the sender,
   transaction hash and block.
10. Export the report and confirm it contains the confirmed result but no
    signature.

If the operation is rejected, confirm the page preserves the AA/RPC code,
sanitizes the message, and suggests a useful next action.

## Security and failure checks

- Submit a bundler request for a non-allowlisted method; expect rejection.
- Submit an oversized JSON-RPC body; expect rejection.
- Open `/report?d=not-valid`; expect the invalid-link state, not an error page.
- Open `/report` with no query; expect the no-summary state.
- Confirm `/report` has `noindex` metadata and is not in `sitemap.xml`.
- Confirm no route returns or logs a private key, seed phrase, signature or
  provider credential.
- Confirm a failed transaction is never reported as confirmed.

## Cleanup

Stop the production server, clear any test wallet connection, and remove local
environment files that contain endpoint credentials before sharing the
repository.
