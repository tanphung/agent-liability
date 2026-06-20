import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AppConfig } from "../lib/env";
import { shorten } from "../utils/format";

export function ContractStatusBanner({ config }: { config: AppConfig }) {
  if (!config.ok) {
    return (
      <section className="status-banner error">
        <AlertTriangle size={20} />
        <div>
          <strong>Contract unavailable</strong>
          {config.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
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
