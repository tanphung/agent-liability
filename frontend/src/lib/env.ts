import type { HexAddress } from "../types/contracts";

export type AppConfig =
  | {
      ok: true;
      mainContractAddress: HexAddress;
      reputationContractAddress: HexAddress;
      network: "studionet";
      rpc: "https://studio.genlayer.com/api";
      chainId: 61999;
      currency: "GEN";
      explorerUrl: "https://explorer-studio.genlayer.com";
    }
  | {
      ok: false;
      errors: string[];
      network: "studionet";
      rpc: "https://studio.genlayer.com/api";
      chainId: 61999;
      currency: "GEN";
      explorerUrl: "https://explorer-studio.genlayer.com";
    };

const STUDIONET = {
  network: "studionet",
  rpc: "https://studio.genlayer.com/api",
  chainId: 61999,
  currency: "GEN",
  explorerUrl: "https://explorer-studio.genlayer.com"
} as const;

const MAIN_ADDRESS_KEY = "agentliability.mainContractAddress";
const REPUTATION_ADDRESS_KEY = "agentliability.reputationContractAddress";

function isAddress(value: string | undefined): value is HexAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "");
}

function fromLocalStorage(key: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage.getItem(key) ?? undefined;
}

function optionalEnv(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export function readConfig(): AppConfig {
  const errors: string[] = [];
  const env = import.meta.env;
  const network = optionalEnv(env.VITE_GENLAYER_NETWORK, STUDIONET.network);
  const rpc = optionalEnv(env.VITE_GENLAYER_RPC, STUDIONET.rpc);
  const chainId = Number(optionalEnv(env.VITE_GENLAYER_CHAIN_ID, String(STUDIONET.chainId)));
  const currency = optionalEnv(env.VITE_GENLAYER_CURRENCY, STUDIONET.currency);
  const explorerUrl = optionalEnv(env.VITE_EXPLORER_URL, STUDIONET.explorerUrl);
  const mainContractAddress = optionalEnv(
    env.VITE_MAIN_CONTRACT_ADDRESS,
    fromLocalStorage(MAIN_ADDRESS_KEY) ?? ""
  );
  const reputationContractAddress = optionalEnv(
    env.VITE_REPUTATION_CONTRACT_ADDRESS,
    fromLocalStorage(REPUTATION_ADDRESS_KEY) ?? ""
  );

  if (network !== STUDIONET.network) {
    errors.push("VITE_GENLAYER_NETWORK must be studionet");
  }
  if (rpc !== STUDIONET.rpc) {
    errors.push("VITE_GENLAYER_RPC must be https://studio.genlayer.com/api");
  }
  if (chainId !== STUDIONET.chainId) {
    errors.push("VITE_GENLAYER_CHAIN_ID must be 61999");
  }
  if (currency !== STUDIONET.currency) {
    errors.push("VITE_GENLAYER_CURRENCY must be GEN");
  }
  if (explorerUrl !== STUDIONET.explorerUrl) {
    errors.push("VITE_EXPLORER_URL must be https://explorer-studio.genlayer.com");
  }
  if (!isAddress(mainContractAddress)) {
    errors.push("Main contract address is missing or invalid");
  }
  if (!isAddress(reputationContractAddress)) {
    errors.push("Reputation contract address is missing or invalid");
  }

  if (errors.length > 0) {
    return { ok: false, errors, ...STUDIONET };
  }

  return {
    ok: true,
    mainContractAddress: mainContractAddress as HexAddress,
    reputationContractAddress: reputationContractAddress as HexAddress,
    ...STUDIONET
  };
}

export function saveContractAddresses(main: string, reputation: string): string[] {
  const errors: string[] = [];
  if (!isAddress(main)) {
    errors.push("Main contract address must be a 20-byte 0x address");
  }
  if (!isAddress(reputation)) {
    errors.push("Reputation contract address must be a 20-byte 0x address");
  }
  if (errors.length === 0) {
    window.localStorage.setItem(MAIN_ADDRESS_KEY, main);
    window.localStorage.setItem(REPUTATION_ADDRESS_KEY, reputation);
  }
  return errors;
}
