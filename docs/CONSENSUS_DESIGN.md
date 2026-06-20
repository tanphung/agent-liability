# Consensus Design

AgentLiability does not accept schema-only consensus. Two validators can produce valid JSON and still materially disagree about who caused the failure. The contract must reject that.

## Why Full Strict Equality Is Wrong

LLM reasons can be phrased differently while agreeing on the material result. Strictly comparing the full JSON would reject equivalent decisions because natural-language `reason` fields differ.

## Material Fields

The validator compares:

- `case_outcome`
- `root_cause_party`
- primary-cause agent
- set of materially faulty agents
- `client_refund_bps`
- per-agent `payout_bps`
- per-agent `bond_slash_bps`
- per-agent `fault_share_bps`

Reason text is stored, but not used for strict consensus.

## Tolerances

```text
MAX_REFUND_DELTA_BPS = 600
MAX_PAYOUT_DELTA_BPS = 600
MAX_SLASH_DELTA_BPS = 750
MAX_FAULT_SHARE_DELTA_BPS = 1000
MATERIAL_FAULT_THRESHOLD_BPS = 1000
```

These tolerances allow close economic judgments while rejecting materially different blame or payout outcomes.

## Rejection Examples

- Leader says `SUCCESS`, validator says `FAILED`.
- Leader blames `AGENT_0`, validator blames `AGENT_1`.
- Leader refunds 20 percent, validator refunds 80 percent.
- Either result pays an agent above its allocation.
- Either result omits or duplicates an agent.
- One result returns an evaluation error and the other returns settlement.

## Acceptance Examples

- Root cause and outcome agree.
- Refund and payouts differ only inside tolerance.
- Reason wording differs.
- Evidence summaries differ in prose but the material decision is stable.

## Safety Assumptions

Validators independently rerender evidence and rerun adjudication. Web evidence is untrusted. If critical sources fail or LLM output is malformed, the contract returns an evaluation-error envelope and deterministic code refuses to settle.
