import { Send, Wand2 } from "lucide-react";
import { useState } from "react";
import { executeWrite, readScalar } from "../lib/genlayer";
import { DEMO_AGENTS, DEMO_CASE, DEMO_EVIDENCE, getDemoDeadlineInput } from "../lib/demoData";
import type { HexAddress, TransactionRecord } from "../types/contracts";
import { parseGenToWei, percentToBps } from "../utils/format";

type AgentInput = {
  wallet: string;
  role: string;
  scopeUrl: string;
  allocationPercent: string;
  bondGen: string;
};

const emptyAgent = (): AgentInput => ({
  wallet: "",
  role: "",
  scopeUrl: "",
  allocationPercent: "",
  bondGen: "0"
});

export function CreateCase({
  account,
  mainContract,
  onTx,
  onCreated
}: {
  account: HexAddress | null;
  mainContract: HexAddress | null;
  onTx: (record: TransactionRecord) => void;
  onCreated: (caseId: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [specUrl, setSpecUrl] = useState("");
  const [manifestUrl, setManifestUrl] = useState("");
  const [criteria, setCriteria] = useState("");
  const [deadline, setDeadline] = useState("");
  const [escrowGen, setEscrowGen] = useState("0");
  const [agents, setAgents] = useState<AgentInput[]>([emptyAgent(), emptyAgent()]);
  const [error, setError] = useState<string | null>(null);
  const [pendingHash, setPendingHash] = useState<HexAddress | null>(null);
  const [busy, setBusy] = useState(false);

  const disabled = !account || !mainContract || busy;
  const canSubmit = !disabled && agents.length >= 2;

  function fillDemoCase() {
    setTitle(DEMO_CASE.title);
    setSpecUrl(DEMO_CASE.specificationUrl);
    setManifestUrl(DEMO_CASE.manifestUrl);
    setCriteria(DEMO_CASE.acceptanceCriteria);
    setDeadline(getDemoDeadlineInput());
    setEscrowGen(DEMO_CASE.escrowGen);
    setAgents(DEMO_AGENTS);
  }

  async function submit() {
    if (!account || !mainContract) {
      return;
    }
    setBusy(true);
    setError(null);
    setPendingHash(null);
    try {
      const beforeCount = Number(await readScalar<bigint | number>(mainContract, "get_case_count"));
      const deadlineSeconds = Math.floor(new Date(deadline).getTime() / 1000);
      const [agent0, agent1] = agents;
      await executeWrite({
        account,
        contract: mainContract,
        functionName: "create_and_adjudicate_case",
        args: [
          title,
          specUrl,
          manifestUrl,
          criteria,
          deadlineSeconds,
          agent0.wallet,
          agent0.role,
          agent0.scopeUrl,
          percentToBps(agent0.allocationPercent),
          DEMO_EVIDENCE.planningDeliverableUrl,
          "Selected API v1 after reading stale docs.",
          agent1.wallet,
          agent1.role,
          agent1.scopeUrl,
          percentToBps(agent1.allocationPercent),
          DEMO_EVIDENCE.codingDeliverableUrl,
          "Implemented the plan but integration failed.",
          DEMO_EVIDENCE.disputeReason,
          DEMO_EVIDENCE.disputeEvidenceUrl
        ],
        value: parseGenToWei(escrowGen),
        label: "Create case and adjudicate",
        onUpdate: (record) => {
          onTx(record);
          if (record.hash) {
            setPendingHash(record.hash);
          }
        }
      });
      const caseId = beforeCount + 1;
      onCreated(caseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <h2>Create Case</h2>
        <button className="button secondary" onClick={fillDemoCase} type="button">
          <Wand2 size={18} />
          Fill Demo Case
        </button>
      </div>
      {error ? <div className="inline-error">{error}</div> : null}
      {busy ? (
        <div className="status-banner">
          GenLayer validators are adjudicating the case. Keep this tab open; the case opens automatically after the
          transaction succeeds.
          {pendingHash ? <span> Transaction {pendingHash.slice(0, 8)}...{pendingHash.slice(-6)}</span> : null}
        </div>
      ) : null}
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Specification URL
        <input value={specUrl} onChange={(event) => setSpecUrl(event.target.value)} />
      </label>
      <label>
        Workflow Manifest URL
        <input value={manifestUrl} onChange={(event) => setManifestUrl(event.target.value)} />
      </label>
      <label>
        Acceptance Criteria
        <textarea value={criteria} onChange={(event) => setCriteria(event.target.value)} />
      </label>
      <div className="form-grid">
        <label>
          Deadline
          <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
        </label>
        <label>
          Escrow GEN
          <input value={escrowGen} onChange={(event) => setEscrowGen(event.target.value)} />
        </label>
      </div>
      <div className="agent-inputs">
        {agents.slice(0, 2).map((agent, index) => (
          <fieldset key={index}>
            <legend>Agent {index}</legend>
            <input
              placeholder="Wallet address"
              value={agent.wallet}
              onChange={(event) =>
                setAgents((items) =>
                  items.map((item, idx) => (idx === index ? { ...item, wallet: event.target.value } : item))
                )
              }
            />
            <input
              placeholder="Role"
              value={agent.role}
              onChange={(event) =>
                setAgents((items) =>
                  items.map((item, idx) => (idx === index ? { ...item, role: event.target.value } : item))
                )
              }
            />
            <input
              placeholder="Scope URL"
              value={agent.scopeUrl}
              onChange={(event) =>
                setAgents((items) =>
                  items.map((item, idx) => (idx === index ? { ...item, scopeUrl: event.target.value } : item))
                )
              }
            />
            <input
              placeholder="Allocation %"
              value={agent.allocationPercent}
              onChange={(event) =>
                setAgents((items) =>
                  items.map((item, idx) =>
                    idx === index ? { ...item, allocationPercent: event.target.value } : item
                  )
                )
              }
            />
          </fieldset>
        ))}
      </div>
      <div className="button-row">
        <button className="button primary" disabled={!canSubmit} onClick={() => void submit()} type="button">
          <Send size={18} />
          Create & Adjudicate
        </button>
      </div>
    </section>
  );
}
