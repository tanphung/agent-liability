import { useCallback, useEffect, useState } from "react";
import type { HexAddress } from "../types/contracts";

function isAddress(value: unknown): value is HexAddress {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function normalizeChainId(raw: unknown): number | null {
  if (typeof raw === "number") {
    return raw;
  }
  if (typeof raw === "bigint") {
    return Number(raw);
  }
  if (typeof raw !== "string") {
    return null;
  }
  if (raw.startsWith("0x")) {
    return Number.parseInt(raw, 16);
  }
  return Number.parseInt(raw, 10);
}

export function useWallet() {
  const [account, setAccount] = useState<HexAddress | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!window.ethereum) {
      setError("No wallet provider found");
      return;
    }
    const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as unknown[];
    setAccount(isAddress(accounts[0]) ? accounts[0] : null);
    const rawChainId = await window.ethereum.request({ method: "eth_chainId" });
    setChainId(normalizeChainId(rawChainId));
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No wallet provider found");
      return;
    }
    setError(null);
    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as unknown[];
    setAccount(isAddress(accounts[0]) ? accounts[0] : null);
    const rawChainId = await window.ethereum.request({ method: "eth_chainId" });
    setChainId(normalizeChainId(rawChainId));
  }, []);

  const switchToStudionet = useCallback(async () => {
    if (!window.ethereum) {
      setError("No wallet provider found");
      return;
    }
    setError(null);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xf22f" }]
      });
    } catch (switchError) {
      const code =
        typeof switchError === "object" && switchError !== null && "code" in switchError
          ? Number((switchError as { code: unknown }).code)
          : 0;
      if (code !== 4902) {
        setError(switchError instanceof Error ? switchError.message : String(switchError));
        return;
      }
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xf22f",
            chainName: "GenLayer Studionet",
            nativeCurrency: {
              name: "GEN",
              symbol: "GEN",
              decimals: 18
            },
            rpcUrls: ["https://studio.genlayer.com/api"],
            blockExplorerUrls: ["https://explorer-studio.genlayer.com"]
          }
        ]
      });
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
    if (!window.ethereum?.on) {
      return;
    }
    const handleAccounts = () => void refresh();
    const handleChain = () => void refresh();
    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccounts);
      window.ethereum?.removeListener?.("chainChanged", handleChain);
    };
  }, [refresh]);

  return {
    account,
    chainId,
    isStudionet: chainId === 61999,
    error,
    connect,
    switchToStudionet,
    refresh
  };
}
