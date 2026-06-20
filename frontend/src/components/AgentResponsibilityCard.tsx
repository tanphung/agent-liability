import type { AgentSummary } from "../types/contracts";
import { bpsToPercent, shorten, weiToGen } from "../utils/format";

export function AgentResponsibilityCard({ agent }: { agent: AgentSummary }) {
  return (
    <article className="agent-card">
      <div className="agent-card-header">
        <div>
          <p>Agent {agent.slot}</p>
          <h3>{agent.role}</h3>
        </div>
        <strong>{agent.verdict || "PENDING"}</strong>
      </div>
      <dl>
        <div>
          <dt>Wallet</dt>
          <dd>{shorten(agent.agent)}</dd>
        </div>
        <div>
          <dt>Allocation</dt>
          <dd>{bpsToPercent(agent.allocation_bps)}</dd>
        </div>
        <div>
          <dt>Bond</dt>
          <dd>{weiToGen(agent.required_bond)} GEN</dd>
        </div>
        <div>
          <dt>Fault</dt>
          <dd>{bpsToPercent(agent.fault_share_bps)}</dd>
        </div>
        <div>
          <dt>Payout</dt>
          <dd>{bpsToPercent(agent.payout_bps)}</dd>
        </div>
        <div>
          <dt>Slash</dt>
          <dd>{bpsToPercent(agent.bond_slash_bps)}</dd>
        </div>
      </dl>
      {agent.reason ? <p className="reason">{agent.reason}</p> : null}
    </article>
  );
}
