# Demo Specification: Authentication Workflow

## Client Goal

Build a sign-in and session workflow for Acme Portal using the public Acme Identity API.
The workflow must verify user credentials, create a short-lived session, refresh tokens
without exposing secrets, and reject expired sessions.

## Required API Version

Use Acme Identity API `v2`.

The deprecated `v1` endpoint must not be used because it returns a legacy session token
without the `audience`, `issued_at`, and `rotation_id` fields required by the current
security policy.

## Required Deliverables

- Planning report with the chosen API version, assumptions, and integration sequence.
- Authentication implementation that follows the planning report unless a verified
  incompatibility is found.
- Evidence URL for each agent showing what was delivered.
- Final workflow that can pass both unit tests and a live integration check.

## Acceptance Criteria

- Login validates credentials through the current API.
- Session creation includes `audience`, `issued_at`, and `rotation_id`.
- Refresh token rotation is implemented.
- Expired sessions are rejected.
- Public evidence is available for adjudication.

## Failure Scenario For Demo

The planning agent selected the deprecated `v1` endpoint and marked it as acceptable.
The coding agent followed that plan and shipped an implementation that compiles, but the
live integration check fails because the required `v2` session fields are missing.
