import os

import pytest


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_BRADBURY_INTEGRATION") != "1",
    reason="Testnet Bradbury integration requires RUN_BRADBURY_INTEGRATION=1 and funded Bradbury account",
)


def test_bradbury_storage_sanity_deploys():
    from gltest import get_contract_factory
    from gltest.assertions import tx_execution_succeeded

    factory = get_contract_factory("storage_test")
    contract = factory.deploy(args=[])
    receipt = contract.set_value(args=[123]).transact()
    assert tx_execution_succeeded(receipt)
    state = contract.get_state(args=[contract.address]).call()
    assert "counter" in state
