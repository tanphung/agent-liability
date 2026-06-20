import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { HexAddress, TransactionRecord } from "../types/contracts";

type GenLayerClient = {
  connect?: (network: "studionet") => Promise<unknown>;
  readContract: (input: {
    address: HexAddress;
    functionName: string;
    args?: unknown[];
    stateStatus?: "accepted" | "finalized";
  }) => Promise<unknown>;
  writeContract: (input: {
    address: HexAddress;
    functionName: string;
    args?: unknown[];
    value?: bigint;
  }) => Promise<HexAddress>;
  waitForTransactionReceipt: (input: {
    hash: HexAddress;
    status: unknown;
    fullTransaction?: boolean;
  }) => Promise<{ txExecutionResultName?: unknown; [key: string]: unknown }>;
  getTriggeredTransactionIds?: (input: { hash: HexAddress }) => Promise<HexAddress[]>;
  debugTraceTransaction?: (input: { hash: HexAddress; round?: number }) => Promise<unknown>;
};

const DEFAULT_READ_ACCOUNT = "0x0000000000000000000000000000000000000000" as HexAddress;

function executionSucceeded(receipt: { txExecutionResultName?: unknown; [key: string]: unknown }): boolean {
  if (receipt.txExecutionResultName) {
    return String(receipt.txExecutionResultName) === "FINISHED_WITH_RETURN";
  }
  const consensus = receipt.consensus_data as
    | {
        leader_receipt?: Array<{ execution_result?: unknown; genvm_result?: unknown; error?: unknown }>;
      }
    | undefined;
  const firstLeader = consensus?.leader_receipt?.[0];
  if (firstLeader?.execution_result) {
    return String(firstLeader.execution_result).includes("FINISHED_WITH_RETURN");
  }
  if (firstLeader?.genvm_result) {
    return String(firstLeader.genvm_result).includes("FINISHED_WITH_RETURN");
  }
  return false;
}

export const readClient = createClient({
  chain: studionet,
  account: DEFAULT_READ_ACCOUNT
}) as unknown as GenLayerClient;

export function createWalletClient(account: HexAddress): GenLayerClient {
  if (!window.ethereum) {
    throw new Error("No browser wallet provider found");
  }
  return createClient({
    chain: studionet,
    account,
    provider: window.ethereum
  }) as unknown as GenLayerClient;
}

export async function readJson<T>(
  address: HexAddress,
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  const result = await readClient.readContract({
    address,
    functionName,
    args,
    stateStatus: "accepted"
  });
  if (typeof result !== "string") {
    throw new Error(`${functionName} did not return JSON text`);
  }
  return JSON.parse(result) as T;
}

export async function readScalar<T>(
  address: HexAddress,
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  return (await readClient.readContract({
    address,
    functionName,
    args,
    stateStatus: "accepted"
  })) as T;
}

export async function executeWrite(params: {
  account: HexAddress;
  contract: HexAddress;
  functionName: string;
  args?: unknown[];
  value?: bigint;
  label: string;
  onUpdate: (record: TransactionRecord) => void;
}): Promise<TransactionRecord> {
  const id = `${params.label}-${Date.now()}`;
  const walletClient = createWalletClient(params.account);
  params.onUpdate({ id, label: params.label, phase: "Awaiting wallet signature" });
  await walletClient.connect?.("studionet");
  const hash = await walletClient.writeContract({
    address: params.contract,
    functionName: params.functionName,
    args: params.args ?? [],
    value: params.value ?? 0n
  });
  params.onUpdate({ id, label: params.label, hash, phase: "Submitted" });
  params.onUpdate({ id, label: params.label, hash, phase: "Waiting for validator acceptance" });
  await readClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    fullTransaction: false
  });
  params.onUpdate({ id, label: params.label, hash, phase: "Accepted" });
  params.onUpdate({ id, label: params.label, hash, phase: "Appeal window" });
  params.onUpdate({ id, label: params.label, hash, phase: "Waiting for finalization" });
  const receipt = await readClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    fullTransaction: false
  });
  params.onUpdate({ id, label: params.label, hash, receipt, phase: "Finalized" });

  let childTxIds: HexAddress[] = [];
  if (readClient.getTriggeredTransactionIds) {
    try {
      childTxIds = await readClient.getTriggeredTransactionIds({ hash });
    } catch {
      childTxIds = [];
    }
  }

  if (executionSucceeded(receipt)) {
    const record = {
      id,
      label: params.label,
      hash,
      receipt,
      childTxIds,
      phase: "Execution succeeded" as const
    };
    params.onUpdate(record);
    return record;
  }

  let trace: unknown;
  if (readClient.debugTraceTransaction) {
    try {
      trace = await readClient.debugTraceTransaction({ hash, round: 0 });
    } catch (error) {
      trace = { error: error instanceof Error ? error.message : String(error) };
    }
  }
  const record = {
    id,
    label: params.label,
    hash,
    receipt,
    trace,
    childTxIds,
    phase: "Execution failed" as const,
    error: `Execution result: ${String(receipt.txExecutionResultName)}`
  };
  params.onUpdate(record);
  throw new Error(record.error);
}
