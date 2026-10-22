import { parseAbi } from "viem";

export const simpleAccountFactoryAbi = parseAbi([
  "function accountImplementation() view returns (address)",
  "function getAddress(address owner, uint256 salt) view returns (address)",
  "function createAccount(address owner, uint256 salt) returns (address)",
]);

export const entryPointV07Abi = parseAbi([
  "function getNonce(address sender, uint192 key) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function getDepositInfo(address account) view returns ((uint256 deposit, bool staked, uint112 stake, uint32 unstakeDelaySec, uint48 withdrawTime))",
]);

export const simpleAccountAbi = parseAbi([
  "function execute(address dest, uint256 value, bytes func)",
  "function getNonce() view returns (uint256)",
  "function getDeposit() view returns (uint256)",
]);
