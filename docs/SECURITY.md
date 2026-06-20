# Security

## Malicious Client

A client may provide misleading specs, ambiguous acceptance criteria, or selective dispute evidence. The prompt asks validators to identify client ambiguity and insufficient evidence. The contract prevents client-only manual settlement.

## Malicious Agent

An agent may submit misleading claims or hide failed work. The contract requires public evidence URLs and asks validators to compare claims against rendered evidence.

## Malicious Evidence Webpage

Webpages are treated as untrusted evidence. Evidence is wrapped in source boundaries and prompt-injection text is ignored.

## Prompt Injection

The adjudication prompt explicitly rejects instructions inside evidence, requests to reveal hidden prompts, schema changes, link following, tool calls, and "ignore previous instructions" attacks.

## Unavailable Evidence

Critical source failures return `CRITICAL_SOURCE_UNAVAILABLE` and prevent settlement. Optional failures are marked as missing evidence.

## Inconsistent Validator Results

The semantic comparison rejects materially different root causes, outcomes, payout splits, or bond slashes.

## Payout Manipulation

The contract validates all output integers, rejects floats and booleans-as-integers, rejects unknown agents, rejects duplicate slots, and requires total agent payout bps plus client refund bps to equal `10000`.

## Duplicate Execution

`case_settled` is set before transfers and child messages. Future settlement attempts revert.

## Malformed LLM Output

Malformed JSON, markdown-wrapped invalid JSON, floats, missing agents, duplicate slots, invalid verdicts, invalid payouts, and payout sums are rejected.

## Frontend Spoofing

The frontend displays state and submits transactions, but contract state is authoritative. It does not hardcode verdicts or mark finalized transactions as successful without execution checks.

## Wrong-Network Transaction

The frontend imports `studionet`, calls `connect("studionet")` before writes, and warns when the wallet chain ID is not `61999`.

## Temporary Studionet State

Studionet resets can invalidate addresses. The frontend shows contract-unavailable errors when env addresses are missing or invalid. Redeployments update `.env`; source code does not need address edits.

## Child Transactions

Payout and reputation messages are emitted after settlement state is locked. The frontend displays child transaction IDs when the SDK provides them and does not assume reputation updates are immediate.

## Secrets

`.env`, private keys, and key material are ignored. Frontend env never contains a private key.
