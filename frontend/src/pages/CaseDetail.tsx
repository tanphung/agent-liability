import { AlertOctagon, Gavel, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { AgentResponsibilityCard } from "../components/AgentResponsibilityCard";
import { CaseStatusBadge } from "../components/CaseStatusBadge";
import { CausalTimeline } from "../components/CausalTimeline";
import { EvidenceSourceCard } from "../components/EvidenceSourceCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PayoutBreakdown } from "../components/PayoutBreakdown";
import { executeWrite } from "../lib/genlayer";
import { readCaseBundle } from "../hooks/useCases";
import { getDemoAgent } from "../lib/demoData";
import type { AgentSummary, CaseSummary, Decision, HexAddress, TransactionRecord } from "../types/contracts";
import { parseGenToWei, percentToBps, shorten, weiToGen } from "../utils/format";

type DraftAgentInput = {
  wallet: string;
  role: string;
  scopeUrl: string;
  allocationPercent: string;
  bondGen: string;
};

const emptyDraftAgent = (): DraftAgentInput => ({
  wallet: "",
  role: "",
  scopeUrl: "",
  allocationPercent: "",
  bondGen: "0"
});

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
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [claimSummary, setClaimSummary] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeUrl, setDisputeUrl] = useState("");
  const [draftAgent, setDraftAgent] = useState<DraftAgentInput>(emptyDraftAgent());
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

  async function addDraftAgent() {
    if (!summary) {
      return;
    }
    await write(
      "add_agent",
      [
        summary.case_id,
        draftAgent.wallet,
        draftAgent.role,
        draftAgent.scopeUrl,
        percentToBps(draftAgent.allocationPercent),
        parseGenToWei(draftAgent.bondGen)
      ],
      `Add agent ${summary.agent_count}`
    );
    setDraftAgent(emptyDraftAgent());
  }

  function fillDemoAgent() {
    const slot = summary?.agent_count ?? 0;
    const agent = getDemoAgent(slot);
    setDraftAgent({
      wallet: agent.wallet,
      role: agent.role,
      scopeUrl: agent.scopeUrl,
      allocationPercent: agent.allocationPercent,
      bondGen: agent.bondGen
    });
  }

  async function deleteDraftCase() {
    if (!summary) {
      return;
    }
    const confirmed = window.confirm(
      "Delete this draft case? This sends a Bradbury transaction that cancels the draft and hides it from the live case list after finalization."
    );
    if (!confirmed) {
      return;
    }
    await write("cancel_draft", [summary.case_id], "Delete draft case");
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

  const myAgent = account ? agents.find((agent) => agent.agent.toLowerCase() === account.toLowerCase()) : undefined;
  const canAdjudicate = account && (summary.client.toLowerCase() === account.toLowerCase() || myAgent);
  const isClient = account ? summary.client.toLowerCase() === account.toLowerCase() : false;
  const canEditDraft = isClient && summary.status === "DRAFT";
  const canPayBond = Boolean(myAgent && summary.status === "FUNDING");
  const canSubmitEvidence = Boolean(myAgent && (summary.status === "ACTIVE" || summary.status === "DISPUTED"));
  const canManageDispute = Boolean(canAdjudicate && (summary.status === "ACTIVE" || summary.status === "DISPUTED"));
  const showAgentActions = canPayBond || canSubmitEvidence || canManageDispute;

  return (
    <section className="page-grid">
      <div className="panel hero-panel">
        <div>
          <p>Case #{summary.case_id}</p>
          <h1>{summary.title}</h1>
          <small>
            Client {shorten(summary.client)} · Escrow {weiToGen(summary.escrow)} GEN
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

      {canEditDraft ? (
        <section className="panel form-panel">
          <h2>Draft Setup</h2>
          {summary.agent_count < 5 ? (
            <>
              <label>
                Agent Wallet
                <input
                  value={draftAgent.wallet}
                  onChange={(event) => setDraftAgent((value) => ({ ...value, wallet: event.target.value }))}
                />
              </label>
              <label>
                Role
                <input
                  value={draftAgent.role}
                  onChange={(event) => setDraftAgent((value) => ({ ...value, role: event.target.value }))}
                />
              </label>
              <label>
                Scope URL
                <input
                  value={draftAgent.scopeUrl}
                  onChange={(event) => setDraftAgent((value) => ({ ...value, scopeUrl: event.target.value }))}
                />
              </label>
              <div className="form-grid">
                <label>
                  Allocation %
                  <input
                    value={draftAgent.allocationPercent}
                    onChange={(event) =>
                      setDraftAgent((value) => ({ ...value, allocationPercent: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Bond GEN
                  <input
                    value={draftAgent.bondGen}
                    onChange={(event) => setDraftAgent((value) => ({ ...value, bondGen: event.target.value }))}
                  />
                </label>
              </div>
              <div className="button-row">
                <button className="button secondary" onClick={fillDemoAgent} type="button">
                  <Plus size={18} />
                  Fill Demo Agent
                </button>
                <button className="button primary" onClick={() => void addDraftAgent()} type="button">
                  <Plus size={18} />
                  Add Agent
                </button>
              </div>
            </>
          ) : null}
          <div className="button-row">
            <button
              className="button danger"
              onClick={() => void deleteDraftCase()}
              type="button"
            >
              <Trash2 size={18} />
              Delete Case
            </button>
            <button
              className="button primary"
              disabled={summary.agent_count < 2}
              onClick={() => void write("activate_case", [summary.case_id], "Activate case")}
              type="button"
            >
              <Upload size={18} />
              Activate Case
            </button>
          </div>
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

      {showAgentActions ? (
        <section className="panel form-panel">
          <h2>Agent Actions</h2>
          {myAgent && canPayBond ? (
            <button
              className="button primary"
              onClick={() =>
                void write(
                  "accept_assignment",
                  [summary.case_id],
                  "Accept assignment",
                  BigInt(myAgent.required_bond)
                )
              }
              type="button"
            >
              <Upload size={18} />
              Pay Bond
            </button>
          ) : null}
          {canSubmitEvidence ? (
            <>
              <label>
                Deliverable URL
                <input value={deliverableUrl} onChange={(event) => setDeliverableUrl(event.target.value)} />
              </label>
              <label>
                Claim Summary
                <textarea value={claimSummary} onChange={(event) => setClaimSummary(event.target.value)} />
              </label>
              <button
                className="button primary"
                onClick={() =>
                  void write("submit_evidence", [summary.case_id, deliverableUrl, claimSummary], "Submit evidence")
                }
                type="button"
              >
                <Upload size={18} />
                Submit Evidence
              </button>
            </>
          ) : null}
          {canManageDispute ? (
            <>
              <label>
                Dispute Reason
                <textarea value={disputeReason} onChange={(event) => setDisputeReason(event.target.value)} />
              </label>
              <label>
                Dispute Evidence URL
                <input value={disputeUrl} onChange={(event) => setDisputeUrl(event.target.value)} />
              </label>
              <div className="button-row">
                <button
                  className="button secondary"
                  onClick={() =>
                    void write("raise_dispute", [summary.case_id, disputeReason, disputeUrl], "Raise dispute")
                  }
                  type="button"
                >
                  <AlertOctagon size={18} />
                  Dispute
                </button>
                <button
                  className="button primary"
                  onClick={() => void write("adjudicate_case", [summary.case_id], "Adjudicate")}
                  type="button"
                >
                  <Gavel size={18} />
                  Adjudicate
                </button>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
