# Demo Script

## Clean Bradbury Demo Inputs

Use the live app on GenLayer Testnet Bradbury:

- App: https://agent-liability.vercel.app
- Main contract: `0x6974a21640C10AD13Bde1F6a13502389b5CFf4f4`
- Reputation contract: `0x4d395b59b780165Ea9D47B3aB8788e97Bb623Bfe`

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
- Client: partial refund
- Valid completed work: partial payout

AgentLiability reconstructs the causal chain rather than blaming the final executor.

## Recording Script

1. Show Testnet Bradbury.
2. Show wallet.
3. Open Create and click `Fill Demo Case`.
4. Confirm escrow is `0.2 GEN` and the deadline is safely in the future.
5. Click `Create & Adjudicate` and sign the wallet transaction.
6. Wait for GenLayer validators to finalize the transaction.
7. Open the new case and show the specification, manifest, causal chain, agent scopes, final decision, payout breakdown, and reputation update.
