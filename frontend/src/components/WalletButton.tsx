import { Wallet } from "lucide-react";
import { shorten } from "../utils/format";
import type { HexAddress } from "../types/contracts";

type Props = {
  account: HexAddress | null;
  isTargetNetwork: boolean;
  onConnect: () => void;
  onSwitchNetwork: () => void;
};

export function WalletButton({ account, isTargetNetwork, onConnect, onSwitchNetwork }: Props) {
  if (account && !isTargetNetwork) {
    return (
      <button className="button wallet-button" onClick={onSwitchNetwork} type="button">
        <Wallet size={18} />
        Switch to Bradbury
        <span className="warn-dot" title="Wrong network" />
      </button>
    );
  }

  return (
    <button className="button wallet-button" onClick={onConnect} type="button">
      <Wallet size={18} />
      {account ? shorten(account) : "Connect Wallet"}
    </button>
  );
}
