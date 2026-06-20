import { FilePlus2, LayoutDashboard, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import { ContractStatusBanner } from "./components/ContractStatusBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NetworkBadge } from "./components/NetworkBadge";
import { TransactionTracker } from "./components/TransactionTracker";
import { WalletButton } from "./components/WalletButton";
import { useWallet } from "./hooks/useWallet";
import { readConfig } from "./lib/env";
import { CaseDetail } from "./pages/CaseDetail";
import { CreateCase } from "./pages/CreateCase";
import { Dashboard } from "./pages/Dashboard";
import { ReputationPage } from "./pages/ReputationPage";
import type { TransactionRecord } from "./types/contracts";

type Tab = "dashboard" | "create" | "case" | "reputation";

export default function App() {
  const [configVersion, setConfigVersion] = useState(0);
  const config = useMemo(() => readConfig(), [configVersion]);
  const wallet = useWallet();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [caseId, setCaseId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  function upsertTx(record: TransactionRecord) {
    setTransactions((items) => {
      const existing = items.findIndex((item) => item.id === record.id);
      if (existing === -1) {
        return [record, ...items].slice(0, 8);
      }
      const next = [...items];
      next[existing] = record;
      return next;
    });
  }

  const mainContract = config.ok ? config.mainContractAddress : null;
  const reputationContract = config.ok ? config.reputationContractAddress : null;

  return (
    <ErrorBoundary>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <Scale size={24} />
            <span>AgentLiability</span>
          </div>
          <NetworkBadge />
          <WalletButton
            account={wallet.account}
            isStudionet={wallet.isStudionet}
            onConnect={() => void wallet.connect()}
            onSwitchNetwork={() => void wallet.switchToStudionet()}
          />
        </header>

        <ContractStatusBanner config={config} onConfigSaved={() => setConfigVersion((value) => value + 1)} />
        {wallet.account && !wallet.isStudionet ? (
          <section className="status-banner error">
            Wallet is on chain ID {wallet.chainId ?? "unknown"}. Switch to Studionet chain ID 61999.
          </section>
        ) : null}
        {wallet.error ? <section className="status-banner error">{wallet.error}</section> : null}

        <main className="layout">
          <nav className="sidebar" aria-label="Primary">
            <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")} type="button">
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button className={tab === "create" ? "active" : ""} onClick={() => setTab("create")} type="button">
              <FilePlus2 size={18} />
              Create
            </button>
            <button className={tab === "case" ? "active" : ""} onClick={() => setTab("case")} type="button">
              <Scale size={18} />
              Case
            </button>
            <button className={tab === "reputation" ? "active" : ""} onClick={() => setTab("reputation")} type="button">
              <Scale size={18} />
              Reputation
            </button>
          </nav>

          <div className="content">
            {tab === "dashboard" ? (
              <Dashboard
                mainContract={mainContract}
                onSelectCase={(id) => {
                  setCaseId(id);
                  setTab("case");
                }}
              />
            ) : null}
            {tab === "create" ? (
              <CreateCase
                account={wallet.account}
                mainContract={mainContract}
                onTx={upsertTx}
                onCreated={(id) => {
                  setCaseId(id);
                  setTab("case");
                }}
              />
            ) : null}
            {tab === "case" ? (
              <CaseDetail caseId={caseId} account={wallet.account} mainContract={mainContract} onTx={upsertTx} />
            ) : null}
            {tab === "reputation" ? <ReputationPage reputationContract={reputationContract} /> : null}
          </div>

          <TransactionTracker transactions={transactions} explorerUrl={config.explorerUrl} />
        </main>
      </div>
    </ErrorBoundary>
  );
}
