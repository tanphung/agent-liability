# Demo Script

## Clean Bradbury Demo Inputs

Use the live app on GenLayer Testnet Bradbury:

- App: https://agent-liability.vercel.app
- Main contract: `0x164EB8dD1B4caDB4d6dBf1F2acc0cf6F5a4A9907`
- Reputation contract: `0x69BA8164d5684008af5c03BB53bbE8df9A483F38`

The Create screen includes `Fill Demo Case`, which populates these public evidence URLs:

- Specification: https://raw.githubusercontent.com/tanphung/agent-liability/main/demo/specification.md
- Manifest: https://raw.githubusercontent.com/tanphung/agent-liability/main/demo/workflow_manifest.json
- Planning scope: https://raw.githubusercontent.com/tanphung/agent-liability/main/demo/planning_agent_scope.md
- Coding scope: https://raw.githubusercontent.com/tanphung/agent-liability/main/demo/coding_agent_scope.md
- Planning deliverable: https://raw.githubusercontent.com/tanphung/agent-liability/main/demo/planning_deliverable.md
- Coding deliverable: https://raw.githubusercontent.com/tanphung/agent-liability/main/demo/coding_deliverable.md
- Dispute evidence: https://raw.githubusercontent.com/tanphung/agent-liability/main/demo/dispute_evidence.md

## Client Request

Build an authentication module using the current public API version.

## Agent 0: Planning Agent

Task:

- analyze API documentation
- design architecture
- define integration steps

Failure:

- chooses an obsolete API version
- does not verify current official documentation

## Agent 1: Coding Agent

Task:

- implement the plan
- integrate authentication
- submit a pull request

Failure:

- follows the plan
- does not cross-check the API
- implementation compiles locally but integration fails

## Evidence URLs

Use public or locally hosted static evidence URLs that Testnet Bradbury can access:

- specification document
- planning report
- GitHub repository or gist
- pull request
- CI report
- testing report
- deployment log

## Expected Decision

The exact payout may vary within consensus tolerance. Expected responsibility:

- Planning Agent: primary cause
- Coding Agent: contributing
- Testing Agent: contributing
- Client: partial refund
- Valid completed work: partial payout
- Bonds: proportional slashing

AgentLiability reconstructs the causal chain rather than blaming the final executor.

## Recording Script

1. Show Testnet Bradbury.
2. Show wallet.
3. If the old `Case #1` is still `DRAFT`, open it and click `Cancel Draft`. It remains on-chain as `CANCELLED` but is hidden from the live dashboard list.
4. Open Create and click `Fill Demo Case`.
5. Submit the case and show the configured contracts.
6. Open the case and show the specification, manifest, causal chain, and agent scopes.
7. Agent wallets accept assignments when available.
8. Agents submit the planning and coding deliverable URLs.
9. Raise a dispute with the dispute evidence URL.
10. Trigger adjudication.
11. Show validator waiting state.
12. Show final execution result, payout breakdown, and reputation update.
