import {
  BRADBURY,
  configureBradburyCli,
  deployContract,
  explorerLink,
  loadEnv,
  optionalOwnerAddress,
  protocolFeeBps,
  requireBradbury,
  requireFundedActiveAccount,
  runCommand,
  saveArtifact,
  writeContract
} from "./bradbury-utils.js";

const env = loadEnv();
requireBradbury(env);
const feeBps = protocolFeeBps(env);
const ownerAddress = optionalOwnerAddress(env);

console.log("Deploying AgentLiability to Testnet Bradbury");
console.log(`RPC: ${BRADBURY.rpc}`);
console.log(`Protocol fee bps: ${feeBps}`);

configureBradburyCli();
requireFundedActiveAccount();

const storage = deployContract("contracts\\storage_test.py");
console.log(`Storage Test Address: ${storage.address}`);

const reputation = deployContract("contracts\\agent_reputation.py");
console.log(`Reputation Contract Address: ${reputation.address}`);

const main = deployContract("contracts\\agent_liability.py", [
  reputation.address,
  String(feeBps)
]);
console.log(`Main Contract Address: ${main.address}`);

const authOutput = writeContract(reputation.address, "set_authorized_contract", [main.address]);
const authHash = authOutput.match(/Transaction Hash:\s*(0x[a-fA-F0-9]{64})/i)?.[1] as
  | `0x${string}`
  | undefined;

let reputationOwnerTransferHash: `0x${string}` | undefined;
let mainOwnerTransferHash: `0x${string}` | undefined;
if (ownerAddress) {
  const repOwnerOutput = writeContract(reputation.address, "transfer_ownership", [ownerAddress]);
  reputationOwnerTransferHash = repOwnerOutput.match(/Transaction Hash:\s*(0x[a-fA-F0-9]{64})/i)?.[1] as
    | `0x${string}`
    | undefined;
  const mainOwnerOutput = writeContract(main.address, "transfer_ownership", [ownerAddress]);
  mainOwnerTransferHash = mainOwnerOutput.match(/Transaction Hash:\s*(0x[a-fA-F0-9]{64})/i)?.[1] as
    | `0x${string}`
    | undefined;
}

runCommand("genlayer", ["schema", main.address, "--rpc", BRADBURY.rpc]);
runCommand("genlayer", ["schema", reputation.address, "--rpc", BRADBURY.rpc]);

const artifact = {
  network: BRADBURY.network,
  rpc: BRADBURY.rpc,
  chainId: BRADBURY.chainId,
  storageTestAddress: storage.address,
  reputationContractAddress: reputation.address,
  mainContractAddress: main.address,
  storageTestTxHash: storage.txHash,
  reputationDeployTxHash: reputation.txHash,
  mainDeployTxHash: main.txHash,
  authorizationTxHash: authHash,
  reputationOwnerTransferTxHash: reputationOwnerTransferHash,
  mainOwnerTransferTxHash: mainOwnerTransferHash,
  ownerAddress,
  protocolFeeBps: feeBps,
  createdAt: new Date().toISOString()
} as const;

saveArtifact("artifacts/bradbury-deployment.json", artifact);

console.log("Deployment artifact saved: artifacts/bradbury-deployment.json");
console.log(`Explorer main: ${explorerLink(main.address)}`);
if (main.txHash) {
  console.log(`Explorer main tx: ${explorerLink(main.txHash)}`);
}
