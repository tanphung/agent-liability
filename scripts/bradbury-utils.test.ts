import { describe, expect, it } from "vitest";
import { assertAddress, requireBradbury } from "./bradbury-utils.js";

describe("Testnet Bradbury tooling guards", () => {
  it("accepts only valid 0x addresses", () => {
    expect(assertAddress("0x0000000000000000000000000000000000000001", "addr")).toBe(
      "0x0000000000000000000000000000000000000001"
    );
    expect(() => assertAddress("0x123", "addr")).toThrow(/20-byte/);
  });

  it("rejects non-Bradbury config", () => {
    expect(() =>
      requireBradbury({
        GENLAYER_NETWORK: "localnet",
        GENLAYER_RPC: "https://rpc-bradbury.genlayer.com",
        GENLAYER_CHAIN_ID: "4221"
      })
    ).toThrow(/Only Testnet Bradbury/);
  });
});
