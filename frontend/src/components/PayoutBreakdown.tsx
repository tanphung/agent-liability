import type { AgentSummary, CaseSummary } from "../types/contracts";
import { bpsToPercent } from "../utils/format";

export function PayoutBreakdown({ summary, agents }: { summary: CaseSummary; agents: AgentSummary[] }) {
  return (
    <section className="panel">
      <h2>Payout</h2>
      <div className="metric-grid">
        <div>
          <span>Client refund</span>
          <strong>{bpsToPercent(summary.client_refund_bps)}</strong>
        </div>
        {agents.map((agent) => (
          <div key={agent.slot}>
            <span>{agent.role}</span>
            <strong>{bpsToPercent(agent.payout_bps)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
