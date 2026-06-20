export function ExecutionResultPanel({ trace }: { trace: unknown }) {
  if (!trace) {
    return null;
  }
  return (
    <details className="execution-panel">
      <summary>Debug trace</summary>
      <pre>{JSON.stringify(trace, null, 2)}</pre>
    </details>
  );
}
