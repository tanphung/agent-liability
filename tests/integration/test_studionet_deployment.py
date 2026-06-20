import os

import pytest


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_STUDIONET_INTEGRATION") != "1",
    reason="Studionet integration requires RUN_STUDIONET_INTEGRATION=1 and funded Studio account",
)


def test_studionet_storage_sanity_deploys():
    from gltest import get_contract_factory
    from gltest.assertions import tx_execution_succeeded

    factory = get_contract_factory("storage_test")
    contract = factory.deploy(args=[])
    receipt = contract.set_value(args=[123]).transact()
    assert tx_execution_succeeded(receipt)
    state = contract.get_state(args=[contract.address]).call()
    assert "counter" in state
