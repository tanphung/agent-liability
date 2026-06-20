import { AlertTriangle, CheckCircle2, Save } from "lucide-react";
import { useState } from "react";
import type { AppConfig } from "../lib/env";
import { saveContractAddresses } from "../lib/env";
import { shorten } from "../utils/format";

export function ContractStatusBanner({ config, onConfigSaved }: { config: AppConfig; onConfigSaved: () => void }) {
  const [mainAddress, setMainAddress] = useState("");
  const [reputationAddress, setReputationAddress] = useState("");
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  if (!config.ok) {
    const onlyAddressErrors = config.errors.every((error) => error.toLowerCase().includes("contract address"));
    return (
      <section className="status-banner error">
        <AlertTriangle size={20} />
        <div>
          <strong>{onlyAddressErrors ? "Contract addresses required" : "Contract configuration error"}</strong>
          {config.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
          {localErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
          {onlyAddressErrors ? (
            <div className="address-config">
              <input
                aria-label="Main contract address"
                placeholder="Main contract address"
                value={mainAddress}
                onChange={(event) => setMainAddress(event.target.value)}
              />
              <input
                aria-label="Reputation contract address"
                placeholder="Reputation contract address"
                value={reputationAddress}
                onChange={(event) => setReputationAddress(event.target.value)}
              />
              <button
                className="button secondary"
                onClick={() => {
                  const errors = saveContractAddresses(mainAddress, reputationAddress);
                  setLocalErrors(errors);
                  if (errors.length === 0) {
                    onConfigSaved();
                  }
                }}
                type="button"
              >
                <Save size={16} />
                Save
              </button>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="status-banner">
      <CheckCircle2 size={20} />
      <div>
        <strong>Contracts configured</strong>
        <p>Main {shorten(config.mainContractAddress)} · Reputation {shorten(config.reputationContractAddress)}</p>
      </div>
    </section>
  );
}
