import {
  STUDIONET,
  assertAddress,
  callContract,
  loadArtifact,
  loadEnv,
  protocolFeeBps,
  requireStudionet,
  runCommand
} from "./studionet-utils.js";

const env = loadEnv();
requireStudionet(env);

const artifact = loadArtifact();
const expectedFee = protocolFeeBps(env);

assertAddress(artifact.storageTestAddress, "Storage Test Address");
assertAddress(artifact.reputationContractAddress, "Reputation Contract Address");
assertAddress(artifact.mainContractAddress, "Main Contract Address");

console.log(`Network: ${STUDIONET.network}`);
console.log(`RPC: ${STUDIONET.rpc}`);
console.log(`Chain ID: ${STUDIONET.chainId}`);

runCommand("genlayer", ["code", artifact.mainContractAddress, "--rpc", STUDIONET.rpc]);
runCommand("genlayer", ["schema", artifact.mainContractAddress, "--rpc", STUDIONET.rpc]);
runCommand("genlayer", ["schema", artifact.reputationContractAddress, "--rpc", STUDIONET.rpc]);

const mainConfig = callContract(artifact.mainContractAddress, "get_protocol_config");
if (!mainConfig.includes(String(expectedFee))) {
  throw new Error(`Main config does not include expected fee ${expectedFee}`);
}
if (!mainConfig.toLowerCase().includes(artifact.reputationContractAddress.toLowerCase())) {
  throw new Error("Main contract does not point to the expected reputation contract");
}

const repConfig = callContract(artifact.reputationContractAddress, "get_config");
if (!repConfig.toLowerCase().includes(artifact.mainContractAddress.toLowerCase())) {
  throw new Error("Reputation contract does not authorize the expected main contract");
}

callContract(artifact.mainContractAddress, "get_case_count");

console.log("Studionet deployment verified");
