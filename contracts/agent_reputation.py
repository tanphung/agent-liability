# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json


MAX_BPS = 10_000
MAX_SCORE = 1_000


class Contract(gl.Contract):
    owner: Address
    authorized_contract: Address
    authorized_configured: bool

    cases_participated: TreeMap[Address, u256]
    successful_cases: TreeMap[Address, u256]
    primary_fault_cases: TreeMap[Address, u256]
    cumulative_fault_bps: TreeMap[Address, u256]
    cumulative_payout_bps: TreeMap[Address, u256]
    reputation_score: TreeMap[Address, u256]
    recorded_outcome: TreeMap[str, bool]

    def __init__(self):
        self.owner = gl.message.sender_address
        self.authorized_configured = False

    @gl.public.write
    def set_authorized_contract(self, address: Address) -> None:
        self._require_owner()
        address = self._to_address(address)
        if self.authorized_configured:
            raise gl.vm.UserError("authorized contract already configured")
        if self._is_zero_address(address):
            raise gl.vm.UserError("authorized contract cannot be zero address")
        self.authorized_contract = address
        self.authorized_configured = True

    @gl.public.write
    def record_outcome(
        self,
        case_id: u256,
        agent: Address,
        verdict: str,
        fault_share_bps: u256,
        payout_bps: u256,
    ) -> None:
        agent = self._to_address(agent)
        if not self.authorized_configured:
            raise gl.vm.UserError("authorized contract not configured")
        if gl.message.sender_address != self.authorized_contract:
            raise gl.vm.UserError("only authorized contract can record outcomes")
        if int(fault_share_bps) < 0 or int(fault_share_bps) > MAX_BPS:
            raise gl.vm.UserError("fault share out of range")
        if int(payout_bps) < 0 or int(payout_bps) > MAX_BPS:
            raise gl.vm.UserError("payout bps out of range")
        if not self._is_allowed_verdict(verdict):
            raise gl.vm.UserError("unknown verdict")

        key = self._outcome_key(case_id, agent)
        if self.recorded_outcome.get(key, False):
            raise gl.vm.UserError("duplicate reputation outcome")

        self.recorded_outcome[key] = True
        self.cases_participated[agent] = u256(
            int(self.cases_participated.get(agent, u256(0))) + 1
        )
        if verdict == "NOT_AT_FAULT" and int(payout_bps) >= 8_000:
            self.successful_cases[agent] = u256(
                int(self.successful_cases.get(agent, u256(0))) + 1
            )
        if verdict == "PRIMARY_CAUSE":
            self.primary_fault_cases[agent] = u256(
                int(self.primary_fault_cases.get(agent, u256(0))) + 1
            )

        self.cumulative_fault_bps[agent] = u256(
            int(self.cumulative_fault_bps.get(agent, u256(0))) + int(fault_share_bps)
        )
        self.cumulative_payout_bps[agent] = u256(
            int(self.cumulative_payout_bps.get(agent, u256(0))) + int(payout_bps)
        )
        self.reputation_score[agent] = u256(self._compute_score(agent))

    @gl.public.view
    def get_agent_reputation(self, agent: Address) -> str:
        agent = self._to_address(agent)
        return json.dumps(
            {
                "agent": self._address_to_str(agent),
                "cases_participated": int(
                    self.cases_participated.get(agent, u256(0))
                ),
                "successful_cases": int(self.successful_cases.get(agent, u256(0))),
                "primary_fault_cases": int(
                    self.primary_fault_cases.get(agent, u256(0))
                ),
                "cumulative_fault_bps": int(
                    self.cumulative_fault_bps.get(agent, u256(0))
                ),
                "cumulative_payout_bps": int(
                    self.cumulative_payout_bps.get(agent, u256(0))
                ),
                "reputation_score": int(self.reputation_score.get(agent, u256(500))),
            },
            sort_keys=True,
        )

    @gl.public.view
    def get_config(self) -> str:
        authorized = ""
        if self.authorized_configured:
            authorized = self._address_to_str(self.authorized_contract)
        return json.dumps(
            {
                "owner": self._address_to_str(self.owner),
                "authorized_contract": authorized,
                "authorized_configured": bool(self.authorized_configured),
                "score_scale": "0-1000",
                "formula": (
                    "500 + success reward + payout reward - fault penalty - "
                    "primary fault penalty, clamped to 0..1000"
                ),
            },
            sort_keys=True,
        )

    def _require_owner(self) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only owner")

    def _is_allowed_verdict(self, verdict: str) -> bool:
        return (
            verdict == "NOT_AT_FAULT"
            or verdict == "CONTRIBUTING"
            or verdict == "PRIMARY_CAUSE"
            or verdict == "NON_PERFORMANCE"
            or verdict == "INSUFFICIENT_EVIDENCE"
        )

    def _compute_score(self, agent: Address) -> int:
        successes = int(self.successful_cases.get(agent, u256(0)))
        primary_faults = int(self.primary_fault_cases.get(agent, u256(0)))
        fault = int(self.cumulative_fault_bps.get(agent, u256(0)))
        payout = int(self.cumulative_payout_bps.get(agent, u256(0)))

        score = 500
        score += min(successes * 25, 200)
        score += min(payout // 200, 200)
        score -= min(fault // 150, 350)
        score -= min(primary_faults * 80, 300)
        if score < 0:
            return 0
        if score > MAX_SCORE:
            return MAX_SCORE
        return score

    def _outcome_key(self, case_id: u256, agent: Address) -> str:
        return f"{int(case_id)}:{self._address_to_str(agent)}"

    def _address_to_str(self, account: Address) -> str:
        account = self._to_address(account)
        if hasattr(account, "as_hex"):
            return account.as_hex
        return str(account)

    def _is_zero_address(self, account: Address) -> bool:
        account = self._to_address(account)
        if hasattr(account, "as_int"):
            return int(account.as_int) == 0
        text = self._address_to_str(account).lower()
        return text == "0x0000000000000000000000000000000000000000"

    def _to_address(self, account):
        if hasattr(account, "as_bytes"):
            return account
        return Address(account)
