# Demo Script

## Client Request

Build an authentication module using a specified public API version.

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

## Agent 2: Testing Agent

Task:

- create unit and integration tests
- verify the API flow

Failure:

- only runs unit tests
- skips the required integration test
- reports success

## Evidence URLs

Use public or locally hosted static evidence URLs that Studionet can access:

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

1. Show Studionet.
2. Show wallet.
3. Create case.
4. Add agents.
5. Deposit bonds.
6. Submit evidence.
7. Raise dispute.
8. Trigger adjudication.
9. Show validator waiting state.
10. Show final execution result.
11. Show payout breakdown.
12. Show reputation update.
