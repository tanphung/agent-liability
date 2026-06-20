import { useCallback, useEffect, useState } from "react";
import type { HexAddress } from "../types/contracts";

function isAddress(value: unknown): value is HexAddress {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
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
    const rawChainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    setChainId(Number.parseInt(rawChainId, 16));
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No wallet provider found");
      return;
    }
    setError(null);
    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as unknown[];
    setAccount(isAddress(accounts[0]) ? accounts[0] : null);
    const rawChainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    setChainId(Number.parseInt(rawChainId, 16));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    account,
    chainId,
    isStudionet: chainId === 61999,
    error,
    connect,
    refresh
  };
}
