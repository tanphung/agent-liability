import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import type { HexAddress, TransactionRecord } from "../types/contracts";
import { getWalletProvider } from "./walletProvider";

type GenLayerClient = {
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
    interval?: number;
    retries?: number;
  }) => Promise<{ txExecutionResultName?: unknown; [key: string]: unknown }>;
  getTriggeredTransactionIds?: (input: { hash: HexAddress }) => Promise<HexAddress[]>;
  debugTraceTransaction?: (input: { hash: HexAddress; round?: number }) => Promise<unknown>;
};

const DEFAULT_READ_ACCOUNT = "0x0000000000000000000000000000000000000000" as HexAddress;
const READ_CALL_SPACING_MS = 900;
const RATE_LIMIT_RETRY_DELAYS_MS = [1_500, 3_000, 6_000];
const WRITE_WAIT_INTERVAL_MS = 5_000;
const WRITE_WAIT_RETRIES = 240;

let readQueue = Promise.resolve();
let lastReadCallAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isRateLimitError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /rate limit|request exceeds defined limit|too many requests/i.test(text);
}

async function runQueuedRead<T>(operation: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_DELAYS_MS.length; attempt += 1) {
      const elapsed = Date.now() - lastReadCallAt;
      if (elapsed < READ_CALL_SPACING_MS) {
        await sleep(READ_CALL_SPACING_MS - elapsed);
      }

      try {
        const result = await operation();
        lastReadCallAt = Date.now();
        return result;
      } catch (error) {
        lastReadCallAt = Date.now();
        const retryDelay = RATE_LIMIT_RETRY_DELAYS_MS[attempt];
        if (!isRateLimitError(error) || retryDelay === undefined) {
          throw error;
        }
        await sleep(retryDelay);
      }
    }
    throw new Error("Bradbury RPC rate limit exceeded. Please wait a moment and refresh.");
  };

  const queued = readQueue.then(run, run);
  readQueue = queued.then(
    () => undefined,
    () => undefined
  );
  return queued;
}

function executionSucceeded(receipt: { txExecutionResultName?: unknown; [key: string]: unknown }): boolean {
  const text = JSON.stringify(receipt).toLowerCase();
  if (text.includes("nondet_disagree") || text.includes("majority_disagree") || text.includes("undetermined")) {
    return false;
  }
  if (receipt.txExecutionResultName) {
    return String(receipt.txExecutionResultName) === "FINISHED_WITH_RETURN";
  }
  if (text.includes("finished_with_error")) {
    return false;
  }
  if (text.includes("finished_with_return")) {
    return true;
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

function executionError(receipt: { txExecutionResultName?: unknown; [key: string]: unknown }): string {
  const txExecutionResult = receipt.txExecutionResultName ?? receipt.execution_result;
  const transaction = receipt.transaction as
    | { execution_result?: unknown; result?: unknown; eq_outputs?: { value?: unknown } }
    | undefined;
  const text = JSON.stringify(receipt).toLowerCase();
  if (text.includes("nondet_disagree") || text.includes("majority_disagree") || text.includes("undetermined")) {
    return "GenLayer consensus was undetermined because validators did not agree on the nondeterministic result.";
  }
  const nestedResult = transaction?.execution_result;
  const consensusResult = transaction?.result;
  const nestedError = transaction?.eq_outputs?.value;
  if (nestedError) {
    return String(nestedError);
  }
  if (txExecutionResult || nestedResult || consensusResult) {
    return `Execution result: ${String(txExecutionResult ?? nestedResult ?? consensusResult)}`;
  }
  return "Execution failed. Open the transaction in GenExplorer for details.";
}

export const readClient = createClient({
  chain: testnetBradbury,
  account: DEFAULT_READ_ACCOUNT
}) as unknown as GenLayerClient;

export function createWalletClient(account: HexAddress): GenLayerClient {
  const provider = getWalletProvider();
  if (!provider) {
    throw new Error("No browser wallet provider found");
  }
  return createClient({
    chain: testnetBradbury,
    account,
    provider
  }) as unknown as GenLayerClient;
}

export async function readJson<T>(
  address: HexAddress,
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  const result = await runQueuedRead(() =>
    readClient.readContract({
      address,
      functionName,
      args,
      stateStatus: "accepted"
    })
  );
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
  return (await runQueuedRead(() =>
    readClient.readContract({
      address,
      functionName,
      args,
      stateStatus: "accepted"
    })
  )) as T;
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
  const hash = await walletClient.writeContract({
    address: params.contract,
    functionName: params.functionName,
    args: params.args ?? [],
    value: params.value ?? 0n
  });
  params.onUpdate({ id, label: params.label, hash, phase: "Submitted" });
  return waitForSubmittedTransaction({ id, label: params.label, hash, onUpdate: params.onUpdate });
}

export async function waitForSubmittedTransaction(params: {
  id: string;
  label: string;
  hash: HexAddress;
  onUpdate: (record: TransactionRecord) => void;
}): Promise<TransactionRecord> {
  const { id, label, hash, onUpdate } = params;
  onUpdate({ id, label, hash, phase: "Running GenLayer adjudication" });
  onUpdate({ id, label, hash, phase: "Waiting for validator acceptance" });
  await readClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    fullTransaction: false,
    interval: WRITE_WAIT_INTERVAL_MS,
    retries: WRITE_WAIT_RETRIES
  });
  onUpdate({ id, label, hash, phase: "Accepted" });
  onUpdate({ id, label, hash, phase: "Appeal window" });
  onUpdate({ id, label, hash, phase: "Waiting for finalization" });
  const receipt = await readClient.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    fullTransaction: true,
    interval: WRITE_WAIT_INTERVAL_MS,
    retries: WRITE_WAIT_RETRIES
  });
  onUpdate({ id, label, hash, receipt, phase: "Finalized" });

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
      label,
      hash,
      receipt,
      childTxIds,
      phase: "Execution succeeded" as const
    };
    onUpdate(record);
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
    label,
    hash,
    receipt,
    trace,
    childTxIds,
    phase: "Execution failed" as const,
    error: executionError(receipt)
  };
  onUpdate(record);
  throw new Error(record.error);
}
