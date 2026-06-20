import json

import pytest


DEADLINE = 4_102_444_800
ESCROW = 100_000
BOND_0 = 10_000
BOND_1 = 20_000


def as_hex(address):
    if isinstance(address, bytes):
        return "0x" + address.hex()
    return str(address)


def deploy_main(direct_deploy, direct_charlie):
    return direct_deploy("contracts/agent_liability.py", direct_charlie, 250)


def create_case(contract, direct_vm):
    direct_vm.value = ESCROW
    case_id = contract.create_case(
        "Authentication module",
        "https://example.com/spec",
        "https://example.com/manifest",
        "Build auth against the public API version named in the spec.",
        DEADLINE,
    )
    direct_vm.value = 0
    return case_id


def add_two_agents(contract, case_id, direct_alice, direct_bob):
    contract.add_agent(
        case_id,
        direct_alice,
        "Planning Agent",
        "https://example.com/scope-planning",
        6_000,
        BOND_0,
    )
    contract.add_agent(
        case_id,
        direct_bob,
        "Coding Agent",
        "https://example.com/scope-coding",
        4_000,
        BOND_1,
    )


def activate_and_accept(contract, case_id, direct_vm, direct_alice, direct_bob):
    contract.activate_case(case_id)
    with direct_vm.prank(direct_alice):
        direct_vm.value = BOND_0
        contract.accept_assignment(case_id)
        direct_vm.value = 0
    with direct_vm.prank(direct_bob):
        direct_vm.value = BOND_1
        contract.accept_assignment(case_id)
        direct_vm.value = 0


def submit_all_evidence(contract, case_id, direct_vm, direct_alice, direct_bob):
    with direct_vm.prank(direct_alice):
        contract.submit_evidence(
            case_id,
            "https://example.com/planning-report",
            "Selected API v1 after reading stale docs.",
        )
    with direct_vm.prank(direct_bob):
        contract.submit_evidence(
            case_id,
            "https://example.com/coding-pr",
            "Implemented the plan but integration failed.",
        )


def valid_decision(refund=6_000, agent_0_payout=0, agent_1_payout=4_000):
    return json.dumps(
        {
            "evaluation_error": False,
            "case_outcome": "PARTIAL_SUCCESS",
            "root_cause_party": "AGENT_0",
            "client_refund_bps": refund,
            "confidence": 86,
            "evidence_quality": "HIGH",
            "reason": "The planning agent introduced the stale API assumption.",
            "agents": [
                {
                    "slot": 0,
                    "verdict": "PRIMARY_CAUSE",
                    "fault_share_bps": 7_000,
                    "payout_bps": agent_0_payout,
                    "bond_slash_bps": 10_000,
                    "reason": "Used obsolete API version.",
                },
                {
                    "slot": 1,
                    "verdict": "CONTRIBUTING",
                    "fault_share_bps": 3_000,
                    "payout_bps": agent_1_payout,
                    "bond_slash_bps": 3_000,
                    "reason": "Did not cross-check the public docs.",
                },
            ],
        }
    )


def mock_sources(direct_vm, include_spec=True, include_optional=True):
    if include_spec:
        direct_vm.mock_web("spec", {"status": 200, "body": "Spec requires API v2."})
    direct_vm.mock_web("manifest", {"status": 200, "body": "Planning precedes coding."})
    direct_vm.mock_web("scope-planning", {"status": 200, "body": "Plan against current docs."})
    direct_vm.mock_web("scope-coding", {"status": 200, "body": "Implement the plan and validate API."})
    if include_optional:
        direct_vm.mock_web("planning-report", {"status": 200, "body": "Plan chose API v1."})
        direct_vm.mock_web("coding-pr", {"status": 200, "body": "CI integration failed."})
        direct_vm.mock_web("dispute", {"status": 200, "body": "Client reports integration failure."})


def swallow_child_messages(direct_vm):
    direct_vm._gl_call_hook = lambda vm, request: {"ok": None}


def test_create_case_success(direct_vm, direct_deploy, direct_charlie):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    summary = json.loads(contract.get_case_summary(case_id))
    assert summary["status"] == "DRAFT"
    assert summary["escrow"] == ESCROW


@pytest.mark.parametrize(
    "value, spec_url, manifest_url, deadline, message",
    [
        (0, "https://example.com/spec", "https://example.com/manifest", DEADLINE, "escrow"),
        (ESCROW, "ftp://example.com/spec", "https://example.com/manifest", DEADLINE, "http"),
        (ESCROW, "https://example.com/spec", "file://manifest", DEADLINE, "http"),
        (ESCROW, "https://example.com/spec", "https://example.com/manifest", 1, "future"),
    ],
)
def test_create_case_rejections(
    direct_vm, direct_deploy, direct_charlie, value, spec_url, manifest_url, deadline, message
):
    contract = deploy_main(direct_deploy, direct_charlie)
    direct_vm.value = value
    with direct_vm.expect_revert(message):
        contract.create_case("Case", spec_url, manifest_url, "criteria", deadline)
    direct_vm.value = 0


def test_only_client_can_add_agent(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("only case client"):
            contract.add_agent(
                case_id,
                direct_alice,
                "Planner",
                "https://example.com/scope",
                5_000,
                1,
            )


def test_agent_validation_and_max_agents(direct_vm, direct_deploy, direct_accounts, direct_charlie):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    contract.add_agent(case_id, direct_accounts[0], "A0", "https://example.com/0", 2_000, 1)
    with direct_vm.expect_revert("already assigned"):
        contract.add_agent(case_id, direct_accounts[0], "A0", "https://example.com/0", 2_000, 1)
    with direct_vm.expect_revert("allocation"):
        contract.add_agent(case_id, direct_accounts[1], "A1", "https://example.com/1", 0, 1)
    for idx in range(1, 5):
        contract.add_agent(
            case_id,
            direct_accounts[idx],
            f"A{idx}",
            f"https://example.com/{idx}",
            2_000,
            1,
        )
    with direct_vm.expect_revert("maximum agents"):
        contract.add_agent(case_id, direct_accounts[5], "A5", "https://example.com/5", 1, 1)


def test_activate_requires_two_agents_and_exact_allocation(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    contract.add_agent(case_id, direct_alice, "Planner", "https://example.com/a", 5_000, 1)
    with direct_vm.expect_revert("at least two"):
        contract.activate_case(case_id)
    contract.add_agent(case_id, direct_bob, "Coder", "https://example.com/b", 4_000, 1)
    with direct_vm.expect_revert("10000"):
        contract.activate_case(case_id)


def test_accept_assignment_bonds_and_duplicate(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    add_two_agents(contract, case_id, direct_alice, direct_bob)
    contract.activate_case(case_id)
    with direct_vm.prank(direct_alice):
        direct_vm.value = BOND_0 - 1
        with direct_vm.expect_revert("incorrect bond"):
            contract.accept_assignment(case_id)
        direct_vm.value = BOND_0
        contract.accept_assignment(case_id)
        with direct_vm.expect_revert("already accepted"):
            contract.accept_assignment(case_id)
        direct_vm.value = 0


def test_submit_evidence_rules_and_update_count(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    add_two_agents(contract, case_id, direct_alice, direct_bob)
    with direct_vm.expect_revert("not accepting evidence"):
        contract.submit_evidence(case_id, "https://example.com/x", "claim")
    activate_and_accept(contract, case_id, direct_vm, direct_alice, direct_bob)
    with direct_vm.prank(direct_charlie):
        with direct_vm.expect_revert("not assigned"):
            contract.submit_evidence(case_id, "https://example.com/x", "claim")
    with direct_vm.prank(direct_alice):
        contract.submit_evidence(case_id, "https://example.com/a", "claim one")
        contract.submit_evidence(case_id, "https://example.com/a2", "claim two")
    summary = json.loads(contract.get_case_summary(case_id))
    assert summary["submitted_count"] == 1


def test_raise_dispute_authorization(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    add_two_agents(contract, case_id, direct_alice, direct_bob)
    activate_and_accept(contract, case_id, direct_vm, direct_alice, direct_bob)
    with direct_vm.prank(direct_charlie):
        with direct_vm.expect_revert("cannot dispute"):
            contract.raise_dispute(case_id, "broken", "https://example.com/dispute")
    contract.raise_dispute(case_id, "integration failed", "https://example.com/dispute")
    assert json.loads(contract.get_case_summary(case_id))["status"] == "DISPUTED"


def test_adjudication_happy_path_and_accounting(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    add_two_agents(contract, case_id, direct_alice, direct_bob)
    activate_and_accept(contract, case_id, direct_vm, direct_alice, direct_bob)
    submit_all_evidence(contract, case_id, direct_vm, direct_alice, direct_bob)
    contract.raise_dispute(case_id, "integration failed", "https://example.com/dispute")
    mock_sources(direct_vm)
    direct_vm.mock_llm("AgentLiability", valid_decision())
    swallow_child_messages(direct_vm)
    contract.adjudicate_case(case_id)

    summary = json.loads(contract.get_case_summary(case_id))
    decision = json.loads(contract.get_case_decision(case_id))
    assert summary["status"] == "DECIDED"
    assert summary["settled"] is True
    assert summary["root_cause"] == "AGENT_0"
    assert decision["agents"][0]["verdict"] == "PRIMARY_CAUSE"
    assert json.loads(contract.get_protocol_config())["protocol_fees_accrued"] == 2_500
    with direct_vm.expect_revert("already settled"):
        contract.adjudicate_case(case_id)


def test_critical_source_unavailable_prevents_settlement(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    add_two_agents(contract, case_id, direct_alice, direct_bob)
    activate_and_accept(contract, case_id, direct_vm, direct_alice, direct_bob)
    submit_all_evidence(contract, case_id, direct_vm, direct_alice, direct_bob)
    mock_sources(direct_vm, include_spec=False)
    with direct_vm.expect_revert("CRITICAL_SOURCE_UNAVAILABLE"):
        contract.adjudicate_case(case_id)


def test_optional_source_unavailable_can_still_settle(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    add_two_agents(contract, case_id, direct_alice, direct_bob)
    activate_and_accept(contract, case_id, direct_vm, direct_alice, direct_bob)
    submit_all_evidence(contract, case_id, direct_vm, direct_alice, direct_bob)
    mock_sources(direct_vm, include_optional=False)
    direct_vm.mock_llm("AgentLiability", valid_decision())
    swallow_child_messages(direct_vm)
    contract.adjudicate_case(case_id)
    assert json.loads(contract.get_case_summary(case_id))["status"] == "DECIDED"


@pytest.mark.parametrize(
    "payload, message",
    [
        ("not-json", "LLM_ERROR"),
        (json.dumps({"evaluation_error": False, "agents": []}), "LLM_ERROR"),
        (
            json.dumps(
                {
                    "evaluation_error": False,
                    "case_outcome": "PARTIAL_SUCCESS",
                    "root_cause_party": "AGENT_0",
                    "client_refund_bps": 6_000.5,
                    "confidence": 86,
                    "evidence_quality": "HIGH",
                    "reason": "bad float",
                    "agents": [],
                }
            ),
            "LLM_ERROR",
        ),
        (
            json.dumps(
                {
                    "evaluation_error": False,
                    "case_outcome": "PARTIAL_SUCCESS",
                    "root_cause_party": "AGENT_0",
                    "client_refund_bps": 6_000,
                    "confidence": 86,
                    "evidence_quality": "HIGH",
                    "reason": "duplicate",
                    "agents": [
                        {
                            "slot": 0,
                            "verdict": "PRIMARY_CAUSE",
                            "fault_share_bps": 7_000,
                            "payout_bps": 0,
                            "bond_slash_bps": 10_000,
                            "reason": "x",
                        },
                        {
                            "slot": 0,
                            "verdict": "CONTRIBUTING",
                            "fault_share_bps": 3_000,
                            "payout_bps": 4_000,
                            "bond_slash_bps": 3_000,
                            "reason": "x",
                        },
                    ],
                }
            ),
            "LLM_ERROR",
        ),
        (valid_decision(refund=7_000, agent_0_payout=0, agent_1_payout=4_000), "LLM_ERROR"),
        (valid_decision(refund=4_000, agent_0_payout=7_000, agent_1_payout=0), "LLM_ERROR"),
    ],
)
def test_bad_llm_outputs_do_not_settle(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, payload, message
):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    add_two_agents(contract, case_id, direct_alice, direct_bob)
    activate_and_accept(contract, case_id, direct_vm, direct_alice, direct_bob)
    submit_all_evidence(contract, case_id, direct_vm, direct_alice, direct_bob)
    mock_sources(direct_vm)
    direct_vm.mock_llm("AgentLiability", payload)
    with direct_vm.expect_revert(message):
        contract.adjudicate_case(case_id)


def test_draft_cancellation_and_fee_withdrawal_rules(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    case_id = create_case(contract, direct_vm)
    swallow_child_messages(direct_vm)
    contract.cancel_draft(case_id)
    assert json.loads(contract.get_case_summary(case_id))["status"] == "CANCELLED"
    active_case = create_case(contract, direct_vm)
    add_two_agents(contract, active_case, direct_alice, direct_bob)
    contract.activate_case(active_case)
    with direct_vm.expect_revert("DRAFT"):
        contract.cancel_draft(active_case)
    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("only owner"):
            contract.withdraw_protocol_fees(direct_alice, 1)
    with direct_vm.expect_revert("exceeds accrued"):
        contract.withdraw_protocol_fees(direct_alice, 1)


def test_owner_can_transfer_main_ownership(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("only owner"):
            contract.transfer_ownership(direct_bob)

    contract.transfer_ownership(direct_alice)
    config = json.loads(contract.get_protocol_config())
    assert config["owner"].lower() == as_hex(direct_alice).lower()

    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("exceeds accrued"):
            contract.withdraw_protocol_fees(direct_alice, 1)


def test_semantic_consensus_accepts_close_material_decisions(
    direct_deploy, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    leader = valid_decision(refund=6_000, agent_0_payout=0, agent_1_payout=4_000)
    validator = valid_decision(refund=5_800, agent_0_payout=0, agent_1_payout=4_200)
    assert contract._compare_material_decisions(leader, validator) is True


def test_semantic_consensus_rejects_schema_only_false_positive(
    direct_deploy, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    leader = json.loads(valid_decision())
    validator = json.loads(valid_decision())
    validator["root_cause_party"] = "AGENT_1"
    validator["agents"][0]["verdict"] = "CONTRIBUTING"
    validator["agents"][1]["verdict"] = "PRIMARY_CAUSE"
    assert contract._compare_material_decisions(json.dumps(leader), json.dumps(validator)) is False


def test_semantic_consensus_rejects_large_refund_disagreement(
    direct_deploy, direct_charlie
):
    contract = deploy_main(direct_deploy, direct_charlie)
    leader = valid_decision(refund=2_000, agent_0_payout=4_000, agent_1_payout=4_000)
    validator = valid_decision(refund=8_000, agent_0_payout=0, agent_1_payout=2_000)
    assert contract._compare_material_decisions(leader, validator) is False
