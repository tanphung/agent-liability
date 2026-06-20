# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json


class Contract(gl.Contract):
    counter: u256
    values: TreeMap[Address, u256]

    def __init__(self):
        self.counter = u256(0)

    @gl.public.write
    def set_value(self, value: u256) -> None:
        self.values[gl.message.sender_address] = value
        self.counter = u256(int(self.counter) + 1)

    @gl.public.view
    def get_state(self, account: Address) -> str:
        account = self._to_address(account)
        return json.dumps(
            {
                "counter": int(self.counter),
                "account": self._address_to_str(account),
                "value": int(self.values.get(account, u256(0))),
            },
            sort_keys=True,
        )

    def _address_to_str(self, account: Address) -> str:
        account = self._to_address(account)
        if hasattr(account, "as_hex"):
            return account.as_hex
        return str(account)

    def _to_address(self, account):
        if hasattr(account, "as_bytes"):
            return account
        return Address(account)
