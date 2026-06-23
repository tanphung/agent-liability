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
const CURRENT_MAIN_CONTRACT_ADDRESS = "0x6974a21640C10AD13Bde1F6a13502389b5CFf4f4";
const CURRENT_REPUTATION_CONTRACT_ADDRESS = "0x4d395b59b780165Ea9D47B3aB8788e97Bb623Bfe";
const RETIRED_MAIN_CONTRACT_ADDRESSES = new Set([
  "0xc57900aa58518da68887e59519cb393ba69a58c6",
  "0x164eb800000000000000000000000000004a9907",
  "0x4ddf0e00000000000000000000000000001cf38c",
  "0x64afb11e45c12f7ed8feaa75cfee15192884bdb1",
  "0xa700304f08fbbebcfc3e0bd96f51145a45d1d3d6"
]);
const RETIRED_REPUTATION_CONTRACT_ADDRESSES = new Set([
  "0xacdb97000000000000000000000000000009c45d",
  "0x69ba810000000000000000000000000000483f38",
  "0x82ee20000000000000000000000000000093fc5a",
  "0x129088d7909e20e74fc2bc14d7d1f815b529f4db",
  "0xa0c8db4f2c7661b16ce43c18e0e5571985b9c9f4"
]);

function isAddress(value: string | undefined): value is HexAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(value ?? "");
}

function fromLocalStorage(key: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage.getItem(key) ?? undefined;
}

function currentOrStoredAddress(envValue: string | undefined, storageKey: string, current: string, retired: Set<string>): string {
  const envAddress = envValue?.trim();
  if (envAddress && isAddress(envAddress)) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, envAddress);
    }
    return envAddress;
  }
  const stored = fromLocalStorage(storageKey);
  if (!stored || retired.has(stored.toLowerCase())) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, current);
    }
    return current;
  }
  return stored;
}

function optionalEnv(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function readConfig(): AppConfig {
  const errors: string[] = [];
  const env = import.meta.env;
  const mainContractAddress = optionalEnv(
    currentOrStoredAddress(
      env.VITE_MAIN_CONTRACT_ADDRESS,
      MAIN_ADDRESS_KEY,
      CURRENT_MAIN_CONTRACT_ADDRESS,
      RETIRED_MAIN_CONTRACT_ADDRESSES
    ),
    CURRENT_MAIN_CONTRACT_ADDRESS
  );
  const reputationContractAddress = optionalEnv(
    currentOrStoredAddress(
      env.VITE_REPUTATION_CONTRACT_ADDRESS,
      REPUTATION_ADDRESS_KEY,
      CURRENT_REPUTATION_CONTRACT_ADDRESS,
      RETIRED_REPUTATION_CONTRACT_ADDRESSES
    ),
    CURRENT_REPUTATION_CONTRACT_ADDRESS
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
