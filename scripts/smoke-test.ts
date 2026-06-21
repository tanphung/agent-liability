import {
  BRADBURY,
  loadArtifact,
  loadEnv,
  requireBradbury,
  writeContract,
  callContract
} from "./bradbury-utils.js";

const env = loadEnv();
requireBradbury(env);
const artifact = loadArtifact();

const deadline = String(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);

console.log("Running Testnet Bradbury smoke test without triggering adjudication");
console.log(`RPC: ${BRADBURY.rpc}`);

const createOutput = writeContract(artifact.mainContractAddress, "create_case", [
  "Smoke auth workflow",
  "https://example.com/spec",
  "https://example.com/manifest",
  "Smoke test case only. Do not adjudicate without public evidence.",
  deadline
]);
console.log(createOutput);

const countOutput = callContract(artifact.mainContractAddress, "get_case_count");
console.log(`Case count: ${countOutput}`);
console.log("Add-agent and activation smoke steps require funded participant accounts; use the frontend or manual CLI with real agent addresses.");
