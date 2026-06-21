import { BarChart3, Boxes, FileSearch, Gauge, ShieldCheck, Workflow } from "lucide-react";

const phases = [
  {
    label: "Now",
    title: "Bradbury Demo Readiness",
    icon: ShieldCheck,
    tone: "green",
    items: [
      "One-signature case creation and adjudication",
      "Persistent transaction recovery across reloads",
      "GenExplorer transaction links and clearer execution errors"
    ]
  },
  {
    label: "Next",
    title: "Evidence Workspace",
    icon: FileSearch,
    tone: "cyan",
    items: [
      "Public evidence availability checks before signing",
      "Inline evidence previews for GitHub, docs, and reports",
      "Structured case report export for reviewer and client handoff"
    ]
  },
  {
    label: "Q3",
    title: "Case Intelligence",
    icon: BarChart3,
    tone: "amber",
    items: [
      "Verdict history with payout and refund charts",
      "Causal-chain comparison across similar workflow failures",
      "Decision confidence trends by evidence quality"
    ]
  },
  {
    label: "Q4",
    title: "Agent Reputation Market",
    icon: Boxes,
    tone: "green",
    items: [
      "Searchable agent profiles and role-specific reliability scores",
      "Past fault patterns by planning, coding, testing, and deployment roles",
      "Reputation-weighted agent selection for future workflows"
    ]
  },
  {
    label: "Scale",
    title: "Contract Operations",
    icon: Workflow,
    tone: "cyan",
    items: [
      "Schema-driven frontend calls after every Bradbury redeploy",
      "Child transaction tracking for payout and reputation messages",
      "Migration tooling for contract upgrades and testnet resets"
    ]
  },
  {
    label: "Polish",
    title: "Performance And Safety",
    icon: Gauge,
    tone: "amber",
    items: [
      "Code-split wallet and GenLayer bundles",
      "Stronger RPC backoff during Bradbury congestion",
      "Richer trace display for failed GenLayer executions"
    ]
  }
];

export function RoadmapPage() {
  return (
    <div className="page-grid roadmap-page">
      <section className="panel roadmap-hero">
        <div>
          <p>AgentLiability Roadmap</p>
          <h1>Workflow Responsibility Infrastructure</h1>
        </div>
        <div className="roadmap-signal">
          <span>Bradbury</span>
          <strong>Live adjudication path</strong>
        </div>
      </section>

      <section className="roadmap-grid" aria-label="Product roadmap">
        {phases.map((phase, index) => {
          const Icon = phase.icon;
          return (
            <article className={`roadmap-card ${phase.tone}`} key={phase.title}>
              <div className="roadmap-card-top">
                <span>{phase.label}</span>
                <Icon size={22} />
              </div>
              <h2>{phase.title}</h2>
              <ol>
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <small>{String(index + 1).padStart(2, "0")}</small>
            </article>
          );
        })}
      </section>
    </div>
  );
}
