import { Wallet } from "lucide-react";
import { shorten } from "../utils/format";
import type { HexAddress } from "../types/contracts";

type Props = {
  account: HexAddress | null;
  isStudionet: boolean;
  onConnect: () => void;
};

export function WalletButton({ account, isStudionet, onConnect }: Props) {
  return (
    <button className="button wallet-button" onClick={onConnect} type="button">
      <Wallet size={18} />
      {account ? shorten(account) : "Connect Wallet"}
      {account && !isStudionet ? <span className="warn-dot" title="Wrong network" /> : null}
    </button>
  );
}
