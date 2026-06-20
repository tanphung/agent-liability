import { describe, expect, it } from "vitest";
import { assertAddress, requireStudionet } from "./studionet-utils.js";

describe("Studionet tooling guards", () => {
  it("accepts only valid 0x addresses", () => {
    expect(assertAddress("0x0000000000000000000000000000000000000001", "addr")).toBe(
      "0x0000000000000000000000000000000000000001"
    );
    expect(() => assertAddress("0x123", "addr")).toThrow(/20-byte/);
  });

  it("rejects non-Studionet config", () => {
    expect(() =>
      requireStudionet({
        GENLAYER_NETWORK: "localnet",
        GENLAYER_RPC: "https://studio.genlayer.com/api",
        GENLAYER_CHAIN_ID: "61999"
      })
    ).toThrow(/Only Studionet/);
  });
});
