import { useCallback, useEffect, useState } from "react";
import { getWalletProvider } from "../lib/walletProvider";
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
    const provider = getWalletProvider();
    if (!provider) {
      setError("No wallet provider found");
      return;
    }
    const accounts = (await provider.request({ method: "eth_accounts" })) as unknown[];
    setAccount(isAddress(accounts[0]) ? accounts[0] : null);
    const rawChainId = await provider.request({ method: "eth_chainId" });
    setChainId(normalizeChainId(rawChainId));
  }, []);

  const connect = useCallback(async () => {
    const provider = getWalletProvider();
    if (!provider) {
      setError("No wallet provider found");
      return;
    }
    setError(null);
    const accounts = (await provider.request({ method: "eth_requestAccounts" })) as unknown[];
    setAccount(isAddress(accounts[0]) ? accounts[0] : null);
    const rawChainId = await provider.request({ method: "eth_chainId" });
    setChainId(normalizeChainId(rawChainId));
  }, []);

  const switchToBradbury = useCallback(async () => {
    const provider = getWalletProvider();
    if (!provider) {
      setError("No wallet provider found");
      return;
    }
    setError(null);
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x107d" }]
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
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x107d",
            chainName: "GenLayer Testnet Bradbury",
            nativeCurrency: {
              name: "GEN",
              symbol: "GEN",
              decimals: 18
            },
            rpcUrls: ["https://rpc.testnet-chain.genlayer.com"],
            blockExplorerUrls: ["https://explorer.testnet-chain.genlayer.com"]
          }
        ]
      });
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const provider = getWalletProvider();
    if (!provider?.on) {
      return;
    }
    const handleAccounts = () => void refresh();
    const handleChain = () => void refresh();
    provider.on("accountsChanged", handleAccounts);
    provider.on("chainChanged", handleChain);
    return () => {
      provider.removeListener?.("accountsChanged", handleAccounts);
      provider.removeListener?.("chainChanged", handleChain);
    };
  }, [refresh]);

  return {
    account,
    chainId,
    isTargetNetwork: chainId === 4221,
    error,
    connect,
    switchToBradbury,
    refresh
  };
}
