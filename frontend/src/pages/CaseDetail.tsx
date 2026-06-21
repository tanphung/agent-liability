import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AgentResponsibilityCard } from "../components/AgentResponsibilityCard";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { CausalTimeline } from "../components/CausalTimeline";
import { EvidenceSourceCard } from "../components/EvidenceSourceCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PayoutBreakdown } from "../components/PayoutBreakdown";
import { executeWrite } from "../lib/genlayer";
import { readCaseBundle } from "../hooks/useCases";
import type { AgentSummary, CaseSummary, Decision, HexAddress, TransactionRecord } from "../types/contracts";
import { shorten, weiToGen } from "../utils/format";

export function CaseDetail({
  caseId,
  account,
  mainContract,
  onTx
}: {
  caseId: number | null;
  account: HexAddress | null;
  mainContract: HexAddress | null;
  onTx: (record: TransactionRecord) => void;
}) {
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!mainContract || caseId === null) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bundle = await readCaseBundle(mainContract, caseId);
      setSummary(bundle.summary);
      setAgents(bundle.agents);
      setDecision(bundle.decision);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [caseId, mainContract]);

  async function write(functionName: string, args: unknown[], label: string, value?: bigint) {
    if (!account || !mainContract) {
      return;
    }
    try {
      await executeWrite({ account, contract: mainContract, functionName, args, value, label, onUpdate: onTx });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function deleteDraftCase() {
    if (!summary) {
      return;
    }
    if (!account) {
      setError(`Connect the client wallet ${shorten(summary.client)} to delete this case.`);
      return;
    }
    if (summary.client.toLowerCase() !== account.toLowerCase()) {
      setError(`This case can only be deleted by the client wallet ${shorten(summary.client)}.`);
      return;
    }
    const confirmed = window.confirm(
      "Delete this case? This sends a Bradbury transaction that cancels it and hides it from the live case list after finalization."
    );
    if (!confirmed) {
      return;
    }
    await write("cancel_draft", [summary.case_id], "Delete case");
  }

  if (caseId === null) {
    return <section className="panel">Select a case</section>;
  }
  if (loading) {
    return <LoadingSkeleton />;
  }
  if (!summary) {
    return <section className="panel">{error ?? "Case unavailable"}</section>;
  }

  const isClient = account ? summary.client.toLowerCase() === account.toLowerCase() : false;
  const canDeleteCreatedCase = isClient && summary.status === "DRAFT";

  return (
    <section className="page-grid">
      <div className="panel hero-panel">
        <div>
          <p>Case #{summary.case_id}</p>
          <h1>{summary.title}</h1>
          <small>
            Client {shorten(summary.client)} | Escrow {weiToGen(summary.escrow)} GEN
          </small>
        </div>
        <CaseStatusBadge status={summary.status} />
      </div>
      {error ? <div className="inline-error">{error}</div> : null}

      <section className="evidence-grid">
        <EvidenceSourceCard label="Specification" url={summary.spec_url} />
        <EvidenceSourceCard label="Manifest" url={summary.manifest_url} />
        {summary.dispute_evidence_url ? <EvidenceSourceCard label="Dispute" url={summary.dispute_evidence_url} /> : null}
      </section>

      <section className="panel">
        <h2>Acceptance Criteria</h2>
        <p>{summary.acceptance_criteria}</p>
      </section>

      <CausalTimeline summary={summary} agents={agents} />

      <section className="agent-grid">
        {agents.map((agent) => (
          <AgentResponsibilityCard key={agent.slot} agent={agent} />
        ))}
      </section>

      {summary.status === "DRAFT" ? (
        <section className="panel form-panel">
          <h2>Case Management</h2>
          <div className="button-row">
            <button
              className="button danger"
              disabled={!canDeleteCreatedCase}
              onClick={() => void deleteDraftCase()}
              title={canDeleteCreatedCase ? "Delete case" : `Only ${shorten(summary.client)} can delete this case`}
              type="button"
            >
              <Trash2 size={18} />
              Delete Case
            </button>
          </div>
          {!canDeleteCreatedCase ? (
            <p className="helper-text">Only the client wallet {shorten(summary.client)} can delete this case.</p>
          ) : null}
        </section>
      ) : null}

      {summary.status === "DECIDED" ? (
        <>
          <PayoutBreakdown summary={summary} agents={agents} />
          <section className="panel">
            <h2>AI Reasoning</h2>
            <p>{decision?.reason ?? "Decision not available"}</p>
          </section>
        </>
      ) : null}

    </section>
  );
}
