# Coding Agent Scope

## Role

The coding agent owns the implementation of the authentication workflow.

## Required Work

- Implement the plan supplied by the planning agent.
- Check for obvious incompatibilities while integrating the API.
- Surface missing response fields or endpoint mismatches before final delivery.
- Provide a public deliverable URL and a concise claim summary.

## Out Of Scope

- Rewriting the entire architecture without client approval.
- Making final payout decisions.
- Concealing integration failures behind passing unit tests.

## Evaluation

The coding agent is partially at fault if it follows a flawed plan but misses visible
implementation signals that the endpoint does not satisfy the acceptance criteria.
