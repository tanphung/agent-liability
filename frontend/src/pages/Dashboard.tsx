import { RefreshCw } from "lucide-react";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { EmptyState } from "../components/EmptyState";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useCases } from "../hooks/useCases";
import type { HexAddress } from "../types/contracts";
import { getStatusLabel } from "../utils/statusDisplay";
import { shorten, weiToGen } from "../utils/format";

const DASHBOARD_STATUSES = ["DRAFT", "FUNDING", "ACTIVE", "DISPUTED", "DECIDED"];

export function Dashboard({
  mainContract,
  onSelectCase
}: {
  mainContract: HexAddress | null;
  onSelectCase: (caseId: number) => void;
}) {
  const { cases, caseCount, loading, error, refresh } = useCases(mainContract);
  const counts = cases.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="page-grid">
      <div className="panel hero-panel">
        <div>
          <p>AgentLiability</p>
          <h1>Workflow Responsibility Adjudication</h1>
        </div>
        <button className="icon-button" onClick={() => void refresh()} title="Refresh cases" type="button">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="metric-grid">
        <div>
          <span>Recent live cases</span>
          <strong>{caseCount}</strong>
        </div>
        {DASHBOARD_STATUSES.map((status) => (
          <div key={status}>
            <span>{getStatusLabel(status)}</span>
            <strong>{counts[status] ?? 0}</strong>
          </div>
        ))}
      </div>

      <section className="panel">
        <h2>Recent Cases</h2>
        {loading ? <LoadingSkeleton /> : null}
        {error ? <div className="inline-error">{error}</div> : null}
        {!loading && !error && cases.length === 0 ? <EmptyState title="No live cases found" /> : null}
        <div className="case-list">
          {cases.map((item) => (
            <button className="case-row" key={item.case_id} onClick={() => onSelectCase(item.case_id)} type="button">
              <span>#{item.case_id}</span>
              <strong>{item.title}</strong>
              <small>{weiToGen(item.escrow)} GEN · {shorten(item.client)}</small>
              <CaseStatusBadge status={item.status} />
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
