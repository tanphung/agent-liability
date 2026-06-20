import {
  STUDIONET,
  configureStudionetCli,
  deployContract,
  explorerLink,
  loadEnv,
  protocolFeeBps,
  requireStudionet,
  runCommand,
  saveArtifact,
  writeContract
} from "./studionet-utils.js";

const env = loadEnv();
requireStudionet(env);
const feeBps = protocolFeeBps(env);

console.log("Deploying AgentLiability to Studionet");
console.log(`RPC: ${STUDIONET.rpc}`);
console.log(`Protocol fee bps: ${feeBps}`);

configureStudionetCli();

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

runCommand("genlayer", ["schema", main.address, "--rpc", STUDIONET.rpc]);
runCommand("genlayer", ["schema", reputation.address, "--rpc", STUDIONET.rpc]);

const artifact = {
  network: STUDIONET.network,
  rpc: STUDIONET.rpc,
  chainId: STUDIONET.chainId,
  storageTestAddress: storage.address,
  reputationContractAddress: reputation.address,
  mainContractAddress: main.address,
  storageTestTxHash: storage.txHash,
  reputationDeployTxHash: reputation.txHash,
  mainDeployTxHash: main.txHash,
  authorizationTxHash: authHash,
  protocolFeeBps: feeBps,
  createdAt: new Date().toISOString()
} as const;

saveArtifact("artifacts/studionet-deployment.json", artifact);

console.log("Deployment artifact saved: artifacts/studionet-deployment.json");
console.log(`Explorer main: ${explorerLink(main.address)}`);
if (main.txHash) {
  console.log(`Explorer main tx: ${explorerLink(main.txHash)}`);
}
