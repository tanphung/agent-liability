import {
  BRADBURY,
  loadArtifact,
  loadEnv,
  requireBradbury,
  callContract
} from "./bradbury-utils.js";

const env = loadEnv();
requireBradbury(env);
const artifact = loadArtifact();

console.log("Running Testnet Bradbury read-only smoke test");
console.log(`RPC: ${BRADBURY.rpc}`);

const protocolOutput = callContract(artifact.mainContractAddress, "get_protocol_config");
const countOutput = callContract(artifact.mainContractAddress, "get_case_count");
const reputationOutput = callContract(artifact.reputationContractAddress, "get_config");

console.log(`Protocol config: ${protocolOutput}`);
console.log(`Case count: ${countOutput}`);
console.log(`Reputation config: ${reputationOutput}`);
console.log("Use the frontend for payable case creation because browser wallet writes include escrow value.");
