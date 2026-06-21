import type { HexAddress } from "../types/contracts";

const RAW_DEMO_BASE = "https://raw.githubusercontent.com/tanphung/agent-liability/main/demo";

export type DemoAgent = {
  wallet: HexAddress;
  role: string;
  scopeUrl: string;
  allocationPercent: string;
  bondGen: string;
};

export const DEMO_CASE = {
  title: "Demo Authentication Workflow Failure",
  specificationUrl: `${RAW_DEMO_BASE}/specification.md`,
  manifestUrl: `${RAW_DEMO_BASE}/workflow_manifest.json`,
  acceptanceCriteria:
    "The agents must deliver a working authentication workflow, document assumptions, and verify public evidence before final settlement.",
  escrowGen: "0.2"
};

export const DEMO_AGENTS: DemoAgent[] = [
  {
    wallet: "0xf8916c192f28b3a6f5e4b731ba85f7c38fab0ea3",
    role: "Planning Agent",
    scopeUrl: `${RAW_DEMO_BASE}/planning_agent_scope.md`,
    allocationPercent: "60",
    bondGen: "0"
  },
  {
    wallet: "0x0722badf775692294241e40ae0fdb31047b6a2c6",
    role: "Coding Agent",
    scopeUrl: `${RAW_DEMO_BASE}/coding_agent_scope.md`,
    allocationPercent: "40",
    bondGen: "0"
  }
];

export const DEMO_EVIDENCE = {
  planningDeliverableUrl: `${RAW_DEMO_BASE}/planning_deliverable.md`,
  codingDeliverableUrl: `${RAW_DEMO_BASE}/coding_deliverable.md`,
  disputeEvidenceUrl: `${RAW_DEMO_BASE}/dispute_evidence.md`
};

export function getDemoAgent(slot: number): DemoAgent {
  return DEMO_AGENTS[Math.min(slot, DEMO_AGENTS.length - 1)];
}

export function getDemoDeadlineInput(): string {
  const now = new Date();
  const deadline = new Date(now.getFullYear(), 8, 30, 23, 59, 0, 0);
  if (deadline <= now) {
    deadline.setFullYear(now.getFullYear() + 1);
  }
  deadline.setMinutes(deadline.getMinutes() - deadline.getTimezoneOffset());
  return deadline.toISOString().slice(0, 16);
}
