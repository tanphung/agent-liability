import type { HexAddress } from "../types/contracts";

export type AppConfig =
  | {
      ok: true;
      mainContractAddress: HexAddress;
      reputationContractAddress: HexAddress;
      network: "testnet-bradbury";
      rpc: "https://rpc-bradbury.genlayer.com";
      chainId: 4221;
      currency: "GEN";
      explorerUrl: "https://explorer-bradbury.genlayer.com";
    }
  | {
      ok: false;
      errors: string[];
      network: "testnet-bradbury";
      rpc: "https://rpc-bradbury.genlayer.com";
      chainId: 4221;
      currency: "GEN";
      explorerUrl: "https://explorer-bradbury.genlayer.com";
    };

const BRADBURY = {
  network: "testnet-bradbury",
  rpc: "https://rpc-bradbury.genlayer.com",
  chainId: 4221,
  currency: "GEN",
  explorerUrl: "https://explorer-bradbury.genlayer.com"
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
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function readConfig(): AppConfig {
  const errors: string[] = [];
  const env = import.meta.env;
  const mainContractAddress = optionalEnv(
    env.VITE_MAIN_CONTRACT_ADDRESS,
    fromLocalStorage(MAIN_ADDRESS_KEY) ?? ""
  );
  const reputationContractAddress = optionalEnv(
    env.VITE_REPUTATION_CONTRACT_ADDRESS,
    fromLocalStorage(REPUTATION_ADDRESS_KEY) ?? ""
  );

  if (!isAddress(mainContractAddress)) {
    errors.push("Main contract address is missing or invalid");
  }
  if (!isAddress(reputationContractAddress)) {
    errors.push("Reputation contract address is missing or invalid");
  }

  if (errors.length > 0) {
    return { ok: false, errors, ...BRADBURY };
  }

  return {
    ok: true,
    mainContractAddress: mainContractAddress as HexAddress,
    reputationContractAddress: reputationContractAddress as HexAddress,
    ...BRADBURY
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
