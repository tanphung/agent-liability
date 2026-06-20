import { Search } from "lucide-react";
import { useState } from "react";
import { readJson } from "../lib/genlayer";
import type { HexAddress, Reputation } from "../types/contracts";

export function ReputationPage({ reputationContract }: { reputationContract: HexAddress | null }) {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<Reputation | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    if (!reputationContract) {
      return;
    }
    setError(null);
    try {
      const data = await readJson<Reputation>(reputationContract, "get_agent_reputation", [address]);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="panel form-panel">
      <h2>Reputation</h2>
      {error ? <div className="inline-error">{error}</div> : null}
      <label>
        Agent Address
        <input value={address} onChange={(event) => setAddress(event.target.value)} />
      </label>
      <button className="button primary" onClick={() => void search()} type="button">
        <Search size={18} />
        Search
      </button>
      {result ? (
        <div className="metric-grid">
          <div>
            <span>Cases</span>
            <strong>{result.cases_participated}</strong>
          </div>
          <div>
            <span>Successes</span>
            <strong>{result.successful_cases}</strong>
          </div>
          <div>
            <span>Primary Faults</span>
            <strong>{result.primary_fault_cases}</strong>
          </div>
          <div>
            <span>Fault BPS</span>
            <strong>{result.cumulative_fault_bps}</strong>
          </div>
          <div>
            <span>Payout BPS</span>
            <strong>{result.cumulative_payout_bps}</strong>
          </div>
          <div>
            <span>Score</span>
            <strong>{result.reputation_score}</strong>
          </div>
        </div>
      ) : null}
      <div className="appeal-box">Reputation update pending until the child transaction is finalized and reflected here.</div>
    </section>
  );
}
