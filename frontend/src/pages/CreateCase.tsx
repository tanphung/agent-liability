import { Plus, Send } from "lucide-react";
import { useState } from "react";
import { executeWrite, readScalar } from "../lib/genlayer";
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
  const [busy, setBusy] = useState(false);

  const disabled = !account || !mainContract || busy;

  async function submit() {
    if (!account || !mainContract) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const beforeCount = Number(await readScalar<bigint | number>(mainContract, "get_case_count"));
      const deadlineSeconds = Math.floor(new Date(deadline).getTime() / 1000);
      await executeWrite({
        account,
        contract: mainContract,
        functionName: "create_case",
        args: [title, specUrl, manifestUrl, criteria, deadlineSeconds],
        value: parseGenToWei(escrowGen),
        label: "Create case",
        onUpdate: onTx
      });
      const caseId = beforeCount + 1;
      for (const [index, agent] of agents.entries()) {
        await executeWrite({
          account,
          contract: mainContract,
          functionName: "add_agent",
          args: [
            caseId,
            agent.wallet,
            agent.role,
            agent.scopeUrl,
            percentToBps(agent.allocationPercent),
            parseGenToWei(agent.bondGen)
          ],
          label: `Add agent ${index}`,
          onUpdate: onTx
        });
      }
      await executeWrite({
        account,
        contract: mainContract,
        functionName: "activate_case",
        args: [caseId],
        label: "Activate case",
        onUpdate: onTx
      });
      onCreated(caseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel form-panel">
      <h2>Create Case</h2>
      {error ? <div className="inline-error">{error}</div> : null}
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
        {agents.map((agent, index) => (
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
            <input
              placeholder="Bond GEN"
              value={agent.bondGen}
              onChange={(event) =>
                setAgents((items) =>
                  items.map((item, idx) => (idx === index ? { ...item, bondGen: event.target.value } : item))
                )
              }
            />
          </fieldset>
        ))}
      </div>
      <div className="button-row">
        <button
          className="button secondary"
          disabled={agents.length >= 5}
          onClick={() => setAgents((items) => [...items, emptyAgent()])}
          type="button"
        >
          <Plus size={18} />
          Add Agent
        </button>
        <button className="button primary" disabled={disabled} onClick={() => void submit()} type="button">
          <Send size={18} />
          Create
        </button>
      </div>
    </section>
  );
}
