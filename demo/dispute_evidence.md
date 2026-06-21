# Dispute Evidence

## Dispute Reason

The delivered authentication workflow does not satisfy the required API version or session
field requirements. The client requests partial settlement and reputation updates based on
causal responsibility.

## Evidence Summary

- The client specification required Acme Identity API `v2`.
- The planning deliverable selected `/v1/login` and `/v1/session/refresh`.
- The planning deliverable did not verify that `v1` was current.
- The coding deliverable followed the flawed plan.
- The coding deliverable passed mocked unit tests but failed the live integration check.
- The implemented response lacks `audience`, `issued_at`, and `rotation_id`.

## Causal Reading

The planning agent is the primary cause because it selected the deprecated API version and
failed to verify public evidence. The coding agent contributed because it did not flag the
missing required fields during implementation. The client specification was clear enough to
identify the required version and fields.

## Suggested Outcome For Demo

- Case outcome: `PARTIAL_SUCCESS`
- Root cause party: `AGENT_0`
- Planning Agent slot 0 verdict: `PRIMARY_CAUSE`
- Coding Agent slot 1 verdict: `CONTRIBUTING`
- Planning Agent payout: `0` bps because the deprecated API decision was the primary cause
- Coding Agent payout: about `2000` bps because it delivered local implementation but missed the integration mismatch
- Client refund: about `8000` bps
- Bond slash: larger slash for the planning agent than the coding agent
