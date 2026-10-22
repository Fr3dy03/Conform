# Contract deployments

This repository does not contain Solidity sources or deployment scripts for the
BOT Chain account-abstraction contracts. Conform reads the official testnet
deployments.

## BOT Chain testnet

| Contract | Address |
| --- | --- |
| EntryPoint v0.7 | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` |
| SimpleAccountFactory | `0xBC88d6012b3bf8426C2851d3798cEB5257658332` |
| SimpleAccount implementation | `0xDE15Ab00C52FF37eCe01C384eB42C802721db823` |

- Chain ID: 968 (`0x3c8`)
- RPC: <https://rpc.bohr.life>
- Bundler: <https://bundler.bohr.life/rpc/>
- Testnet explorer: <https://scan.bohr.life>

## ABIs used

The chain package contains the minimal ABIs needed to:

- derive a counterfactual SimpleAccount with
  `SimpleAccountFactory.getAddress(owner, salt)`,
- read `EntryPoint.getNonce(sender, key)` and `EntryPoint.balanceOf(account)`,
- build `SimpleAccount.execute(target, value, data)`,
- build `SimpleAccountFactory.createAccount(owner, salt)`.

See `packages/chain/src/abi.ts`.

## Scope

- Only EntryPoint v0.7 is tested.
- No contracts are deployed by this repository.
- No upgrade, ownership or admin functions are called.
- EOA Paymaster and EIP-7702 authorization flows are outside the tested path.
- Contract presence is checked with `eth_getCode`; this is not a security audit.

Before using different addresses, verify them against the current official BOT
Chain account-abstraction documentation:
<https://dev-docs.botchain.ai/docs/Account-Abstraction/network-and-endpoints>.
