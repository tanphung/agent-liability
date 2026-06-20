import { ExternalLink } from "lucide-react";
import type { TransactionRecord } from "../types/contracts";
import { shorten } from "../utils/format";

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
            {tx.error ? <pre>{tx.error}</pre> : null}
            {tx.childTxIds && tx.childTxIds.length > 0 ? (
              <p>Child transactions: {tx.childTxIds.map((id) => shorten(id, 4)).join(", ")}</p>
            ) : null}
          </div>
          {tx.hash ? (
            <a href={`${explorerUrl}/search?q=${tx.hash}`} target="_blank" rel="noreferrer" title="Open explorer">
              {shorten(tx.hash, 4)}
              <ExternalLink size={14} />
            </a>
          ) : null}
        </article>
      ))}
    </aside>
  );
}
