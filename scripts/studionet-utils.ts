import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

export const STUDIONET = {
  network: "studionet",
  rpc: "https://studio.genlayer.com/api",
  chainId: 61999,
  explorer: "https://explorer-studio.genlayer.com",
  currency: "GEN"
} as const;

export type DeploymentArtifact = {
  network: "studionet";
  rpc: typeof STUDIONET.rpc;
  chainId: typeof STUDIONET.chainId;
  storageTestAddress: `0x${string}`;
  reputationContractAddress: `0x${string}`;
  mainContractAddress: `0x${string}`;
  storageTestTxHash?: `0x${string}`;
  reputationDeployTxHash?: `0x${string}`;
  mainDeployTxHash?: `0x${string}`;
  authorizationTxHash?: `0x${string}`;
  reputationOwnerTransferTxHash?: `0x${string}`;
  mainOwnerTransferTxHash?: `0x${string}`;
  ownerAddress?: `0x${string}`;
  protocolFeeBps: number;
  createdAt: string;
};

export function loadEnv(path = ".env"): Record<string, string> {
  const values: Record<string, string> = {};
  if (!existsSync(path)) {
    return values;
  }
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    values[key] = value;
  }
  return { ...values, ...process.env } as Record<string, string>;
}

export function requireStudionet(env: Record<string, string>): void {
  const network = env.GENLAYER_NETWORK || STUDIONET.network;
  const rpc = env.GENLAYER_RPC || STUDIONET.rpc;
  const chainId = Number(env.GENLAYER_CHAIN_ID || STUDIONET.chainId);
  if (network !== STUDIONET.network) {
    throw new Error(`Only Studionet is supported. Got GENLAYER_NETWORK=${network}`);
  }
  if (rpc !== STUDIONET.rpc) {
    throw new Error(`Only ${STUDIONET.rpc} is supported. Got GENLAYER_RPC=${rpc}`);
  }
  if (chainId !== STUDIONET.chainId) {
    throw new Error(`Only chain ID ${STUDIONET.chainId} is supported. Got ${chainId}`);
  }
}

export function protocolFeeBps(env: Record<string, string>): number {
  const raw = env.PROTOCOL_FEE_BPS || "250";
  if (!/^\d+$/.test(raw)) {
    throw new Error("PROTOCOL_FEE_BPS must be an integer");
  }
  const fee = Number(raw);
  if (fee < 0 || fee > 1000) {
    throw new Error("PROTOCOL_FEE_BPS must be between 0 and 1000");
  }
  return fee;
}

export function optionalOwnerAddress(env: Record<string, string>): `0x${string}` | undefined {
  if (!env.OWNER_ADDRESS) {
    return undefined;
  }
  return assertAddress(env.OWNER_ADDRESS, "OWNER_ADDRESS");
}

export function assertAddress(value: string | undefined, label: string): `0x${string}` {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${label} must be a 20-byte 0x address`);
  }
  return value as `0x${string}`;
}

export function assertFile(path: string): void {
  if (!existsSync(path)) {
    throw new Error(`Required file not found: ${path}`);
  }
}

export function runCommand(command: string, args: string[]): string {
  const executable = process.platform === "win32" && command === "genlayer" ? "genlayer.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  if (result.error) {
    throw new Error(
      `Failed to run ${command}. Is the GenLayer CLI installed? Original error: ${result.error.message}`
    );
  }
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${output}`);
  }
  return output;
}

export function configureStudionetCli(): void {
  try {
    runCommand("genlayer", ["network", STUDIONET.network]);
  } catch (firstError) {
    try {
      runCommand("genlayer", ["network", "set", STUDIONET.network]);
    } catch {
      throw firstError;
    }
  }
}

export function parseDeploymentOutput(output: string): {
  address: `0x${string}`;
  txHash?: `0x${string}`;
} {
  const address = output.match(/['"]?Contract Address['"]?:\s*['"]?(0x[a-fA-F0-9]{40})/i)?.[1];
  const txHash = output.match(/['"]?Transaction Hash['"]?:\s*['"]?(0x[a-fA-F0-9]{64})/i)?.[1];
  if (!address) {
    throw new Error(`Could not parse deployed contract address from CLI output:\n${output}`);
  }
  return {
    address: address as `0x${string}`,
    txHash: txHash as `0x${string}` | undefined
  };
}

export function deployContract(contractPath: string, args: string[] = []): {
  address: `0x${string}`;
  txHash?: `0x${string}`;
  output: string;
} {
  assertFile(contractPath);
  const cliArgs = ["deploy", "--contract", contractPath, "--rpc", STUDIONET.rpc];
  if (args.length > 0) {
    cliArgs.push("--args", ...args);
  }
  const output = runCommand("genlayer", cliArgs);
  const parsed = parseDeploymentOutput(output);
  return { ...parsed, output };
}

export function writeContract(address: string, method: string, args: string[] = []): string {
  const cliArgs = ["write", address, method, "--rpc", STUDIONET.rpc];
  if (args.length > 0) {
    cliArgs.push("--args", ...args);
  }
  return runCommand("genlayer", cliArgs);
}

export function callContract(address: string, method: string, args: string[] = []): string {
  const cliArgs = ["call", address, method, "--rpc", STUDIONET.rpc];
  if (args.length > 0) {
    cliArgs.push("--args", ...args);
  }
  return runCommand("genlayer", cliArgs);
}

export function saveArtifact(path: string, artifact: DeploymentArtifact): void {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(path, `${JSON.stringify(artifact, null, 2)}\n`);
}

export function loadArtifact(path = "artifacts/studionet-deployment.json"): DeploymentArtifact {
  if (!existsSync(path)) {
    throw new Error(`Deployment artifact not found: ${path}`);
  }
  const parsed = JSON.parse(readFileSync(path, "utf8")) as DeploymentArtifact;
  if (parsed.network !== STUDIONET.network || parsed.rpc !== STUDIONET.rpc) {
    throw new Error("Deployment artifact is not for Studionet");
  }
  assertAddress(parsed.storageTestAddress, "storageTestAddress");
  assertAddress(parsed.reputationContractAddress, "reputationContractAddress");
  assertAddress(parsed.mainContractAddress, "mainContractAddress");
  return parsed;
}

export function explorerLink(hashOrAddress: string): string {
  return `${STUDIONET.explorer}/search?q=${encodeURIComponent(hashOrAddress)}`;
}
