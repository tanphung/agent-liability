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

function parseDeadlineSeconds(input: string): number {
  const match = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error("Deadline must use English numeric format YYYY-MM-DD HH:mm");
  }
  const [, year, month, day, hours, minutes] = match;
  const deadline = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), 0, 0);
  if (
    deadline.getFullYear() !== Number(year) ||
    deadline.getMonth() !== Number(month) - 1 ||
    deadline.getDate() !== Number(day) ||
    deadline.getHours() !== Number(hours) ||
    deadline.getMinutes() !== Number(minutes)
  ) {
    throw new Error("Deadline is not a valid calendar date");
  }
  if (deadline <= new Date()) {
    throw new Error("Deadline must be in the future");
  }
  return Math.floor(deadline.getTime() / 1000);
}

async function waitForCreatedCaseId(mainContract: HexAddress, beforeCount: number): Promise<number> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const count = Number(await readScalar<bigint | number>(mainContract, "get_case_count"));
    if (count > beforeCount) {
      return count;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 3_000));
  }
  throw new Error("Transaction succeeded, but the new case is not readable on-chain yet. Please refresh in a moment.");
}

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
      const deadlineSeconds = parseDeadlineSeconds(deadline);
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
      const caseId = await waitForCreatedCaseId(mainContract, beforeCount);
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
      <div className="form-section">
        <h3>Case Evidence</h3>
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
      </div>

      <div className="form-section">
        <h3>Settlement Terms</h3>
        <div className="form-grid">
          <label>
            Deadline
            <input
              inputMode="numeric"
              placeholder="2026-09-30 23:59"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
            <span className="field-note">Use English numeric format: YYYY-MM-DD HH:mm, local time.</span>
          </label>
          <label>
            Escrow GEN
            <input value={escrowGen} onChange={(event) => setEscrowGen(event.target.value)} />
            <span className="field-note">Demo escrow is 0.2 GEN on Testnet Bradbury.</span>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Workflow Agents</h3>
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
