export type HexAddress = `0x${string}`;

export type CaseSummary = {
  case_id: number;
  client: HexAddress;
  title: string;
  spec_url: string;
  manifest_url: string;
  acceptance_criteria: string;
  deadline: number;
  created_at: number;
  status: "DRAFT" | "FUNDING" | "ACTIVE" | "DISPUTED" | "DECIDED" | "CANCELLED" | string;
  escrow: number;
  agent_count: number;
  joined_count: number;
  submitted_count: number;
  dispute_reason: string;
  dispute_evidence_url: string;
  outcome: string;
  root_cause: string;
  confidence: number;
  client_refund_bps: number;
  settled: boolean;
};

export type AgentSummary = {
  slot: number;
  agent: HexAddress;
  role: string;
  scope_url: string;
  allocation_bps: number;
  required_bond: number;
  joined: boolean;
  bond_paid: number;
  deliverable_url: string;
  claim_summary: string;
  submitted: boolean;
  verdict: string;
  fault_share_bps: number;
  payout_bps: number;
  bond_slash_bps: number;
  reason: string;
};

export type Decision = {
  evaluation_error?: boolean;
  case_outcome?: string;
  root_cause_party?: string;
  client_refund_bps?: number;
  confidence?: number;
  evidence_quality?: string;
  reason?: string;
  agents?: AgentSummary[];
};

export type Reputation = {
  agent: HexAddress;
  cases_participated: number;
  successful_cases: number;
  primary_fault_cases: number;
  cumulative_fault_bps: number;
  cumulative_payout_bps: number;
  reputation_score: number;
};

export type TransactionPhase =
  | "Awaiting wallet signature"
  | "Submitted"
  | "Running GenLayer adjudication"
  | "Waiting for validator acceptance"
  | "Accepted"
  | "Appeal window"
  | "Waiting for finalization"
  | "Finalized"
  | "Execution succeeded"
  | "Execution failed";

export type TransactionRecord = {
  id: string;
  label: string;
  contract?: HexAddress;
  hash?: HexAddress;
  phase: TransactionPhase;
  error?: string;
  receipt?: unknown;
  trace?: unknown;
  childTxIds?: HexAddress[];
};
