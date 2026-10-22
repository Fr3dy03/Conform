# On-chain interaction records

Live BOT Chain testnet activity produced by Conform's verification runs, with
wallet explorer links. All values were re-verified over RPC on 22 October 2026.
Testnet only; no paymaster was used on any operation.

## Accounts

| Role | Address | Explorer |
| --- | --- | --- |
| SimpleAccount owner (EOA) | `0x5a043e74A78c5534DF9C7f76685b36A59774FD37` | [scan.bohr.life/address/…74FD37](https://scan.bohr.life/address/0x5a043e74A78c5534DF9C7f76685b36A59774FD37) |
| Smart account (SimpleAccount) | `0x750c09Ff0c9dd3215F2451D3DB878Afa9915A731` | [scan.bohr.life/address/…15A731](https://scan.bohr.life/address/0x750c09Ff0c9dd3215F2451D3DB878Afa9915A731) |

- Chain: BOT Chain Testnet, chain ID 968 (`0x3c8`)
- EntryPoint v0.7: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`
- SimpleAccountFactory: `0xBC88d6012b3bf8426C2851d3798cEB5257658332`
- Salt: `0`; EntryPoint nonce as of the second record: `2`

## Interaction 1 — SimpleAccount deployment

The counterfactual account was created by the first UserOperation (factory +
factoryData included). Gas was prefunded from the smart account; no paymaster.

| Field | Value |
| --- | --- |
| Date (UTC) | 2026-10-21, ~21:20 |
| userOpHash | `0x886bffcb8dfa41b06967e2c7c0480b4c1a8936bc35b1b7fb561b2a01797f2789` |
| Transaction | [`0xce8c0c20…c634b2995`](https://scan.bohr.life/tx/0xce8c0c20457e7358578f567e550b18c06cc8998c84c51c80b45b634c634b2995) |
| Block | 27678217 |
| Receipt status | `0x1` (success) |
| Gas used (tx receipt) | 275,279 |
| Logs | 7 |

Full transaction:
[0xce8c0c20457e7358578f567e550b18c06cc8998c84c51c80b45b634c634b2995](https://scan.bohr.life/tx/0xce8c0c20457e7358578f567e550b18c06cc8998c84c51c80b45b634c634b2995)

## Interaction 2 — End-to-end conformance UserOperation

The live console run: derive the deployed account, estimate, sign the raw
`userOpHash` with the owner wallet (`personal_sign`), submit through the
bundler, and verify the receipt. No-value `execute()` call to the owner EOA;
no paymaster.

| Field | Value |
| --- | --- |
| Date (UTC) | 2026-10-22, ~09:25 |
| userOpHash | `0x24d063bf0c03082bfa8b221ef1052b92d89c951b23153da70c0bd3cfe3112a75` |
| Transaction | [`0x3769fc03…80271a58d7d`](https://scan.bohr.life/tx/0x3769fc038c641c03f11e5cd3165744376c089ad035524e1bc228680271a58d7d) |
| Block | 27735482 |
| Receipt status | `0x1` (success) |
| Bundler receipt | `success: true` |
| Gas used (tx receipt) | 87,757 |
| Logs | 3 |

Full transaction:
[0x3769fc038c641c03f11e5cd3165744376c089ad035524e1bc228680271a58d7d](https://scan.bohr.life/tx/0x3769fc038c641c03f11e5cd3165744376c089ad035524e1bc228680271a58d7d)

Conform only reported success after both conditions held: the bundler receipt
reported `success: true` and the outer transaction status was `0x1`. The run
finished with 21 passed checks and 1 unknown (ERC-4337 sponsorship — expected
without a verified paymaster).

## How to verify independently

1. Open either transaction link above and confirm status `Success` and the
   block number in the tables.
2. Open the smart-account link and confirm the account has code and an
   EntryPoint nonce of 2 (two UserOperations).
3. Optionally re-run the checks yourself: `npm install`, `npm run dev`, open
   `/console`, and run live diagnostics against chain 968.

Sponsorship is intentionally not claimed: gas was prefunded from the smart
account, and no BOT-compatible paymaster was configured or exercised.
