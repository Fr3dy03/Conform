# UI research

Researched on 2026-10-21. No reference product was supplied as a Figma file, so the review covered the
official BOT Chain surfaces and representative ERC-4337 developer tools in the same problem space.
Nothing below is copied into the product; the notes describe interaction patterns and the decisions
Conform makes differently.

## Sources reviewed

| Source | What was useful |
| --- | --- |
| [BOT Chain developer docs](https://dev-docs.botchain.ai/) | Network values, EntryPoint v0.7, bundler RPC, SimpleAccount, paymaster and EIP-7702 status |
| [BOT Chain testnet explorer](https://scan.bohr.life/) | How UserOperations, bundles, EIP-7702 authorizations and contract state are exposed as public records |
| [BOT Chain brand kit and guideline](https://www.botchain.ai/static/BOT%20Chain%20Assets/BOT%20Chain%20Brand%20Kit.zip) | Official logo geometry, colours and the instruction not to edit or distort the mark |
| [Alchemy Bundler API docs](https://www.alchemy.com/docs/wallets/transactions/low-level-infra/bundler/overview) | Standard bundler method set, receipt semantics and the "lookup returns `null` until included" pattern |
| [Pimlico bundler docs](https://docs.pimlico.io/infra/bundler/usage) | Developer-facing method lists, public endpoint constraints and traceability of a UserOperation from receipt to inclusion |
| [ERC-4337 compatibility test suite](https://docs.erc4337.io/bundlers/compatibility-test-suite.html) | Conformance as a matrix of behaviours rather than a single "connected" check |
| [Stackup docs](https://docs.stackup.fi/) | Task-oriented getting started, security guidance and bundler operations framing |

## Observed interaction patterns

1. **Infrastructure tools lead with a runnable action, not a feature grid.** Hero copy is short and
   a code example, endpoint or "get started" action appears above the fold. Trust is built with
   concrete network names and supported standards.
2. **The useful unit is a run, not a page load.** Developer consoles tend to show a request or
   operation with a start time, method, latency and terminal state. Users scan for the one failed
   step; they do not read every success row.
3. **Method-level evidence is expected.** Mature tools expose JSON-RPC method names, chain IDs,
   raw error codes and links to the transaction/explorer. Summaries are useful only when the
   evidence is one click away.
4. **Progress is staged and explicit.** Simulation, submission, bundling, inclusion and execution
   success are distinct states. A submitted hash is not a confirmed transaction, and a successful
   outer transaction is not necessarily a successful UserOperation.
5. **Dense tables work when hierarchy is strong.** Compact key/value rows, monospace identifiers,
   copy affordances and status text are preferred over decorative cards. Charts are secondary in
   troubleshooting tools.
6. **Wallet flows are interruptive by design.** The good ones explain what the wallet is about to
   sign, keep the network identity visible, and separate the signature request from any later
   network submission.
7. **Specials are explained in context.** Explorer navigation separates UserOperations, bundles and
   7702 authorizations. Tools that hide those distinctions create false confidence.
8. **Error states are a primary surface.** The best examples pair an error with the method, stage,
   likely cause and a concrete next check. A raw toast is not a diagnostic.
9. **Sample data is risky unless labelled.** "Recent activity" in a new workspace can be mistaken
   for real network state. The demo path must be unmistakable everywhere it appears.
10. **Public footers carry identity and provenance.** Official marks are placed on dark surfaces
    with ample clear space; links to the chain, explorer and docs are grouped as a trust block.

## Design choices adapted

- **Run-centric console.** A conformance run is the object around which every screen is organised:
  stage groups, pass/warn/fail counts, a chronological timeline and a report built from the same run.
- **Method-level evidence.** Every check expands to the RPC method, duration, endpoint host and raw
  code. Tables are compact and monospace-led.
- **Explicit lifecycle language.** "Estimated", "signed", "submitted", "included" and "confirmed"
  are separate labels. The product never upgrades "submitted" to "success" on a hash alone.
- **Actionable failures.** Failures include stage, method, normalized code, readable cause, and one
  suggested next diagnostic. BOT Chain AA error codes (AA10, AA21, AA24, AA25, AA31, AA33) are
  mapped to suggestions using the official troubleshooting table.
- **A demo mode that is honest.** The demo workspace is explicit sample data with a persistent
  "Demo mode" banner, a distinct source field in the report, and no wallet calls.
- **A single-page workbench with anchored sections.** Desktop uses a persistent left rail; mobile
  uses a horizontally scrollable section switcher. Deep sections remain reachable without losing
  run state.
- **Restrained status palette.** Lime means passed or confirmed, amber means pending, warning or
  unknown, coral means failed. Colour is always paired with text and an icon.

## Visual direction

- Graphite surfaces (`#090b0a`, `#101411`, `#151a16`) with hairline borders and very low-contrast
  grid/noise texture.
- A precise, instrument-panel feel: numbered stages, tabular numerals, compact labels, visible
  latency and chain metadata.
- Lime is an accent, not a background wash. Amber carries ambiguity and sponsorship status.
- Typography pairs a tight geometric sans for headings with a monospace face for identifiers,
  methods and data tables.
- Code snippets read as evidence blocks, with a filename/method header and copy affordance.
- Motion is limited to a travelling scan line while a run is active and short status transitions;
  `prefers-reduced-motion` removes non-essential motion.

## How Conform is deliberately distinct

- It is **BOT Chain-specific**, not another multichain account-abstraction dashboard. The network,
  EntryPoint, factory, implementation and bundler values are pinned to verified BOT Chain testnet
  values by default and remain configurable.
- It is a **conformance workbench**, not a paymaster marketplace or analytics product. There are no
  charts for transaction volume, no sponsorship budget widgets and no implied paymaster coverage.
- It treats **sponsorship as unknown by default**. A configured paymaster only unlocks contract
  presence and funding checks; Conform never turns an address or a third-party brand name into a
  "supported" claim.
- It shows the **whole path to a receipt**, including the distinction between bundler acceptance and
  on-chain success.
- It uses an **evidence-first layout**: the report is assembled from captured method calls, not
  hand-written marketing copy.
- Its look is a **dark precision instrument**: graphite, lime and amber, dense tables and a
  diagnostic timeline. It does not use the lighter investor/operations aesthetic of other
  products in the ecosystem.
- All official marks are used **unmodified** from BOT Chain's brand kit. Conform's own mark is
  separate and no BOT Chain colours are used to imply endorsement.
