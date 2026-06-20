import type { AgentSummary, CaseSummary } from "../types/contracts";

export function CausalTimeline({ summary, agents }: { summary: CaseSummary; agents: AgentSummary[] }) {
  return (
    <section className="panel">
      <h2>Causal Chain</h2>
      <ol className="timeline">
        <li>
          <strong>Specification</strong>
          <span>{summary.title}</span>
        </li>
        {agents.map((agent) => (
          <li key={agent.slot}>
            <strong>{agent.role}</strong>
            <span>{agent.verdict || (agent.submitted ? "Evidence submitted" : "Awaiting evidence")}</span>
          </li>
        ))}
        <li>
          <strong>Decision</strong>
          <span>{summary.root_cause || "Pending"}</span>
        </li>
      </ol>
    </section>
  );
}
