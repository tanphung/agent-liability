# Consensus Design

AgentLiability uses GenLayer for the AI judgment step and then applies a deterministic consensus guard to the proposed decision. This keeps the Bradbury demo stable while still requiring the verdict to be machine-checkable before any escrow settlement can happen.

## Why Full Strict Equality Is Wrong

LLM reason text can be phrased differently while agreeing on the material result. Strictly comparing full JSON across separate LLM runs can turn a valid subjective judgment into `NONDET_DISAGREE`.

## Guarded Decision Fields

The validator accepts a leader proposal only after normalizing and validating:

- `case_outcome`
- `root_cause_party`
- `client_refund_bps`
- each agent `slot`
- each agent `verdict`
- each agent `fault_share_bps`
- each agent `payout_bps`
- each agent `bond_slash_bps`

Reason text is stored for review, but settlement is based on normalized deterministic fields.

## Deterministic Rejection Rules

- Unknown case outcomes are rejected.
- Unknown root causes are rejected.
- Unknown agent verdicts are rejected.
- Missing, duplicate, or out-of-range agent slots are rejected.
- Any bps field outside `0..10000` is rejected.
- Any agent payout above that agent's allocation is rejected.
- Total agent payout plus client refund must equal exactly `10000`.
- Evaluation-error envelopes are rejected before settlement.

## Acceptance Examples

- The decision identifies `AGENT_0` as the primary cause and pays within the agent allocation.
- The decision marks `AGENT_1` as contributing and assigns a partial payout.
- The decision refunds the client with the remaining bps.
- Reason wording is concise or verbose as long as the canonical fields are valid.
