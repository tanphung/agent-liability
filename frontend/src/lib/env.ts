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

function isAddress(value: string | undefined): value is HexAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "");
}

export function readConfig(): AppConfig {
  const errors: string[] = [];
  const env = import.meta.env;

  if (env.VITE_GENLAYER_NETWORK !== STUDIONET.network) {
    errors.push("VITE_GENLAYER_NETWORK must be studionet");
  }
  if (env.VITE_GENLAYER_RPC !== STUDIONET.rpc) {
    errors.push("VITE_GENLAYER_RPC must be https://studio.genlayer.com/api");
  }
  if (Number(env.VITE_GENLAYER_CHAIN_ID) !== STUDIONET.chainId) {
    errors.push("VITE_GENLAYER_CHAIN_ID must be 61999");
  }
  if (env.VITE_GENLAYER_CURRENCY !== STUDIONET.currency) {
    errors.push("VITE_GENLAYER_CURRENCY must be GEN");
  }
  if (env.VITE_EXPLORER_URL !== STUDIONET.explorerUrl) {
    errors.push("VITE_EXPLORER_URL must be https://explorer-studio.genlayer.com");
  }
  if (!isAddress(env.VITE_MAIN_CONTRACT_ADDRESS)) {
    errors.push("VITE_MAIN_CONTRACT_ADDRESS is missing or invalid");
  }
  if (!isAddress(env.VITE_REPUTATION_CONTRACT_ADDRESS)) {
    errors.push("VITE_REPUTATION_CONTRACT_ADDRESS is missing or invalid");
  }

  if (errors.length > 0) {
    return { ok: false, errors, ...STUDIONET };
  }

  return {
    ok: true,
    mainContractAddress: env.VITE_MAIN_CONTRACT_ADDRESS,
    reputationContractAddress: env.VITE_REPUTATION_CONTRACT_ADDRESS,
    ...STUDIONET
  };
}
