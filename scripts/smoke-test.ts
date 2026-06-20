import {
  STUDIONET,
  loadArtifact,
  loadEnv,
  requireStudionet,
  writeContract,
  callContract
} from "./studionet-utils.js";

const env = loadEnv();
requireStudionet(env);
const artifact = loadArtifact();

const deadline = String(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);

console.log("Running Studionet smoke test without triggering adjudication");
console.log(`RPC: ${STUDIONET.rpc}`);

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
