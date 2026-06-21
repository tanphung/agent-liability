import { FilePlus2, LayoutDashboard, Map, Scale } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ContractStatusBanner } from "./components/ContractStatusBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NetworkBadge } from "./components/NetworkBadge";
import { TransactionTracker } from "./components/TransactionTracker";
import { WalletButton } from "./components/WalletButton";
import { useWallet } from "./hooks/useWallet";
import { readConfig } from "./lib/env";
import { readScalar, waitForSubmittedTransaction } from "./lib/genlayer";
import { CaseDetail } from "./pages/CaseDetail";
import { CreateCase } from "./pages/CreateCase";
import { Dashboard } from "./pages/Dashboard";
import { ReputationPage } from "./pages/ReputationPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import type { TransactionRecord } from "./types/contracts";

type Tab = "dashboard" | "create" | "case" | "reputation" | "roadmap";

const TRANSACTIONS_STORAGE_KEY = "agentliability.transactions";
const TERMINAL_PHASES = new Set(["Execution succeeded", "Execution failed"]);

function loadStoredTransactions(): TransactionRecord[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TRANSACTIONS_STORAGE_KEY) ?? "[]") as TransactionRecord[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function storableTransaction(record: TransactionRecord): TransactionRecord {
  return {
    id: record.id,
    label: record.label,
    hash: record.hash,
    phase: record.phase,
    error: record.error,
    childTxIds: record.childTxIds
  };
}

export default function App() {
  const [configVersion, setConfigVersion] = useState(0);
  const config = useMemo(() => readConfig(), [configVersion]);
  const wallet = useWallet();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [caseId, setCaseId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(loadStoredTransactions);
  const resumedTxIds = useRef(new Set<string>());

  function upsertTx(record: TransactionRecord) {
    setTransactions((items) => {
      const existing = items.findIndex((item) => item.id === record.id);
      if (existing === -1) {
        return [storableTransaction(record), ...items].slice(0, 8);
      }
      const next = [...items];
      next[existing] = storableTransaction(record);
      return next;
    });
  }

  const mainContract = config.ok ? config.mainContractAddress : null;
  const reputationContract = config.ok ? config.reputationContractAddress : null;

  useEffect(() => {
    window.localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (!mainContract) {
      return;
    }
    for (const tx of transactions) {
      if (!tx.hash || TERMINAL_PHASES.has(tx.phase) || resumedTxIds.current.has(tx.id)) {
        continue;
      }
      resumedTxIds.current.add(tx.id);
      void waitForSubmittedTransaction({
        id: tx.id,
        label: tx.label,
        hash: tx.hash,
        onUpdate: upsertTx
      })
        .then(async () => {
          if (tx.label === "Create case and adjudicate") {
            const count = Number(await readScalar<bigint | number>(mainContract, "get_case_count"));
            if (count > 0) {
              setCaseId(count);
              setTab("case");
            }
          }
        })
        .catch((error) => {
          upsertTx({
            ...tx,
            phase: "Execution failed",
            error: error instanceof Error ? error.message : String(error)
          });
        });
    }
  }, [mainContract, transactions]);

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
            isTargetNetwork={wallet.isTargetNetwork}
            onConnect={() => void wallet.connect()}
            onSwitchNetwork={() => void wallet.switchToBradbury()}
          />
        </header>

        <ContractStatusBanner config={config} onConfigSaved={() => setConfigVersion((value) => value + 1)} />
        {wallet.account && !wallet.isTargetNetwork ? (
          <section className="status-banner error">
            Wallet is on chain ID {wallet.chainId ?? "unknown"}. Switch to Testnet Bradbury chain ID 4221.
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
            <button className={tab === "roadmap" ? "active" : ""} onClick={() => setTab("roadmap")} type="button">
              <Map size={18} />
              Roadmap
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
            {tab === "roadmap" ? <RoadmapPage /> : null}
          </div>

          <TransactionTracker transactions={transactions} explorerUrl={config.explorerUrl} />
        </main>
      </div>
    </ErrorBoundary>
  );
}
