# Testnet Bradbury Deployment

## Network Information

```text
Network: Testnet Bradbury
RPC: https://rpc-bradbury.genlayer.com
Chain ID: 4221
Currency: GEN
Explorer: https://explorer-bradbury.genlayer.com
Faucet: https://testnet-faucet.genlayer.foundation/
```

## CLI Workflow

```powershell
Set-Location -LiteralPath 'D:\app genlayer\AgentLiability'

genlayer network set testnet-bradbury

genlayer deploy --contract contracts\storage_test.py --rpc https://rpc-bradbury.genlayer.com

genlayer deploy --contract contracts\agent_reputation.py --rpc https://rpc-bradbury.genlayer.com
```

Deploy the main contract with actual constructor args:

```powershell
genlayer deploy --contract contracts\agent_liability.py --rpc https://rpc-bradbury.genlayer.com --args <reputation-contract-address> 250
```

Then configure authorization:

```powershell
genlayer write <reputation-contract-address> set_authorized_contract --rpc https://rpc-bradbury.genlayer.com --args <main-contract-address>
```

If deployment is signed by a temporary account, transfer ownership after authorization:

```powershell
genlayer write <reputation-contract-address> transfer_ownership --rpc https://rpc-bradbury.genlayer.com --args <owner-address>
genlayer write <main-contract-address> transfer_ownership --rpc https://rpc-bradbury.genlayer.com --args <owner-address>
```

After deployment:

1. Verify the deployment transaction execution result.
2. Record addresses in root `.env`.
3. Record addresses in `frontend/.env`.
4. Run:

```powershell
npm run verify:bradbury
```

5. Run the frontend:

```powershell
Set-Location -LiteralPath 'D:\app genlayer\AgentLiability\frontend'
npm run dev
```

## Testnet Bradbury Caveat

Testnet Bradbury is temporary. Resetting shared state may invalidate addresses. Redeployment may be required. App configuration must be updated after redeployment. Do not advertise Testnet Bradbury deployment as production deployment.
