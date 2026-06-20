export function CaseStatusBadge({ status }: { status: string }) {
  return <span className={`case-status ${status.toLowerCase()}`}>{status}</span>;
}
