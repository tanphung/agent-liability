# Planning Agent Scope

## Role

The planning agent owns the architecture decision for the authentication workflow.

## Required Work

- Read the client specification.
- Verify the current public API version before choosing endpoints.
- Identify required response fields for sessions and token rotation.
- Produce a planning report that the coding agent can follow.
- Mark uncertain or unverified assumptions explicitly.

## Out Of Scope

- Writing production code.
- Making final payout decisions.
- Ignoring the client requirement to verify current public evidence.

## Evaluation

The planning agent is at fault if it chooses a deprecated API version, treats an
unverified assumption as confirmed, or omits a required security field from the plan.
