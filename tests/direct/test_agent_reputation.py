import json


def deploy_reputation(direct_deploy):
    return direct_deploy("contracts/agent_reputation.py")


def test_owner_configures_authorized_contract(direct_deploy, direct_bob):
    contract = deploy_reputation(direct_deploy)
    contract.set_authorized_contract(direct_bob)
    config = json.loads(contract.get_config())
    assert config["authorized_configured"] is True


def test_non_owner_and_second_configuration_rejected(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_reputation(direct_deploy)
    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("only owner"):
            contract.set_authorized_contract(direct_bob)
    contract.set_authorized_contract(direct_bob)
    with direct_vm.expect_revert("already configured"):
        contract.set_authorized_contract(direct_alice)


def test_record_outcome_authorization_duplicate_and_score(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy_reputation(direct_deploy)
    contract.set_authorized_contract(direct_bob)
    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("only authorized"):
            contract.record_outcome(1, direct_alice, "NOT_AT_FAULT", 0, 10_000)
    with direct_vm.prank(direct_bob):
        contract.record_outcome(1, direct_alice, "NOT_AT_FAULT", 0, 10_000)
        with direct_vm.expect_revert("duplicate"):
            contract.record_outcome(1, direct_alice, "NOT_AT_FAULT", 0, 10_000)
    rep = json.loads(contract.get_agent_reputation(direct_alice))
    assert rep["cases_participated"] == 1
    assert rep["successful_cases"] == 1
    assert 0 <= rep["reputation_score"] <= 1_000


def test_primary_fault_penalty_is_deterministic(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = deploy_reputation(direct_deploy)
    contract.set_authorized_contract(direct_bob)
    with direct_vm.prank(direct_bob):
        contract.record_outcome(7, direct_alice, "PRIMARY_CAUSE", 10_000, 0)
    rep = json.loads(contract.get_agent_reputation(direct_alice))
    assert rep["primary_fault_cases"] == 1
    assert rep["cumulative_fault_bps"] == 10_000
    assert rep["reputation_score"] < 500
