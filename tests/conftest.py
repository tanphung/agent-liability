import os
import tempfile

def pytest_configure(config):
    from gltest.direct import loader
    from gltest.direct.vm import VMContext

    def windows_safe_inject_message_to_fd0(vm):
        from genlayer.py import calldata
        from genlayer.py.types import Address

        sender_addr = vm.sender
        if isinstance(sender_addr, bytes):
            sender_addr = Address(sender_addr)
        contract_addr = vm._contract_address
        if isinstance(contract_addr, bytes):
            contract_addr = Address(contract_addr)
        origin_addr = vm.origin
        if isinstance(origin_addr, bytes):
            origin_addr = Address(origin_addr)

        message_data = {
            "contract_address": contract_addr,
            "sender_address": sender_addr,
            "origin_address": origin_addr,
            "stack": [],
            "value": vm._value,
            "datetime": vm._datetime,
            "is_init": False,
            "chain_id": vm._chain_id,
            "entry_kind": 0,
            "entry_data": b"",
            "entry_stage_data": None,
        }

        fd, path = tempfile.mkstemp()
        os.write(fd, calldata.encode(message_data))
        os.lseek(fd, 0, os.SEEK_SET)
        vm._original_stdin_fd = os.dup(0)
        os.dup2(fd, 0)
        os.close(fd)
        vm._gltest_temp_stdin_path = path

    original_cleanup = VMContext._cleanup_after_deactivate

    def cleanup_with_temp_unlink(self):
        path = getattr(self, "_gltest_temp_stdin_path", None)
        try:
            original_cleanup(self)
        finally:
            if path:
                try:
                    os.unlink(path)
                except OSError:
                    pass
                self._gltest_temp_stdin_path = None

    loader._inject_message_to_fd0 = windows_safe_inject_message_to_fd0
    VMContext._cleanup_after_deactivate = cleanup_with_temp_unlink
