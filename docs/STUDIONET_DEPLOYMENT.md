# Studionet Deployment

## Network Information

```text
Network: Studionet
RPC: https://studio.genlayer.com/api
Chain ID: 61999
Currency: GEN
Explorer: https://explorer-studio.genlayer.com
Faucet: Built-in Studio faucet
```

## CLI Workflow

```powershell
Set-Location -LiteralPath 'D:\app genlayer\AgentLiability'

genlayer network studionet

genlayer deploy --contract contracts\storage_test.py --rpc https://studio.genlayer.com/api

genlayer deploy --contract contracts\agent_reputation.py --rpc https://studio.genlayer.com/api
```

Deploy the main contract with actual constructor args:

```powershell
genlayer deploy --contract contracts\agent_liability.py --rpc https://studio.genlayer.com/api --args <reputation-contract-address> 250
```

Then configure authorization:

```powershell
genlayer write <reputation-contract-address> set_authorized_contract <main-contract-address> --rpc https://studio.genlayer.com/api
```

After deployment:

1. Verify the deployment transaction execution result.
2. Record addresses in root `.env`.
3. Record addresses in `frontend/.env`.
4. Run:

```powershell
npm run verify:studionet
```

5. Run the frontend:

```powershell
Set-Location -LiteralPath 'D:\app genlayer\AgentLiability\frontend'
npm run dev
```

## Hosted Studio Workflow

1. Open `https://studio.genlayer.com/run-debug`.
2. Open Settings.
3. Reset Storage when necessary.
4. Confirm.
5. Hard refresh:
   - Windows: `Ctrl+Shift+F5`
   - macOS: `Cmd+Shift+R`
6. Deploy `contracts/storage_test.py`.
7. Click the deployment transaction.
8. Confirm status and execution result.
9. Deploy `agent_reputation.py`.
10. Record address.
11. Deploy `agent_liability.py` with constructor arguments:
    - reputation contract address
    - protocol fee bps
12. Record address.
13. Call `set_authorized_contract`.
14. Verify read methods:
    - `get_protocol_config`
    - `get_config`
    - `get_case_count`
15. Fund required accounts with the built-in faucet.
16. Copy addresses into frontend `.env`.

## Studionet Caveat

Studionet is temporary. Resetting shared state may invalidate addresses. Redeployment may be required. App configuration must be updated after redeployment. Do not advertise Studionet deployment as production deployment.
