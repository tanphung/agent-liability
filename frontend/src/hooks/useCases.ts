import { useCallback, useEffect, useState } from "react";
import { readJson, readScalar } from "../lib/genlayer";
import type { AgentSummary, CaseSummary, Decision, HexAddress } from "../types/contracts";

export function useCases(mainContract: HexAddress | null) {
  const [caseCount, setCaseCount] = useState<number>(0);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!mainContract) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rawCount = await readScalar<bigint | number>(mainContract, "get_case_count");
      const count = Number(rawCount);
      setCaseCount(count);
      if (count === 0) {
        setCases([]);
      } else {
        const start = Math.max(0, count - 10);
        const range = await readJson<CaseSummary[]>(mainContract, "get_case_range", [start, 10]);
        setCases(range);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [mainContract]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { caseCount, cases, loading, error, refresh };
}

export async function readCaseBundle(mainContract: HexAddress, caseId: number) {
  const [summary, agents, decision] = await Promise.all([
    readJson<CaseSummary>(mainContract, "get_case_summary", [caseId]),
    readJson<AgentSummary[]>(mainContract, "get_case_agents", [caseId]),
    readJson<Decision>(mainContract, "get_case_decision", [caseId])
  ]);
  return { summary, agents, decision };
}
