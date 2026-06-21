import { ExternalLink } from "lucide-react";
import type { TransactionRecord } from "../types/contracts";
import { shorten } from "../utils/format";

function transactionHint(phase: TransactionRecord["phase"]): string | null {
  if (phase === "Running GenLayer adjudication" || phase === "Waiting for validator acceptance") {
    return "GenLayer validators are rendering evidence and running AI consensus. This can take several minutes on Bradbury.";
  }
  if (phase === "Waiting for finalization") {
    return "The result was accepted and is now waiting for the finality window to close.";
  }
  return null;
}

function transactionUrl(explorerUrl: string, hash: string): string {
  return `${explorerUrl.replace(/\/$/, "")}/tx/${hash}`;
}

export function TransactionTracker({
  transactions,
  explorerUrl
}: {
  transactions: TransactionRecord[];
  explorerUrl: string;
}) {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <aside className="tx-panel">
      <h2>Transactions</h2>
      {transactions.map((tx) => (
        <article key={tx.id} className={`tx-row ${tx.phase === "Execution failed" ? "failed" : ""}`}>
          <div>
            <strong>{tx.label}</strong>
            <p>{tx.phase}</p>
            {transactionHint(tx.phase) ? <p>{transactionHint(tx.phase)}</p> : null}
            {tx.error ? <pre>{tx.error}</pre> : null}
            {tx.childTxIds && tx.childTxIds.length > 0 ? (
              <p>Child transactions: {tx.childTxIds.map((id) => shorten(id, 4)).join(", ")}</p>
            ) : null}
          </div>
          {tx.hash ? (
            <a href={transactionUrl(explorerUrl, tx.hash)} target="_blank" rel="noreferrer" title="Open transaction in GenExplorer">
              {shorten(tx.hash, 4)}
              <ExternalLink size={14} />
            </a>
          ) : null}
        </article>
      ))}
    </aside>
  );
}
