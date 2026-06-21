import { getStatusLabel } from "../utils/statusDisplay";

export function CaseStatusBadge({ status }: { status: string }) {
  return <span className={`case-status ${status.toLowerCase()}`}>{getStatusLabel(status)}</span>;
}
