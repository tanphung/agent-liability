import { Inbox } from "lucide-react";

export function EmptyState({ title }: { title: string }) {
  return (
    <div className="empty-state">
      <Inbox size={28} />
      <p>{title}</p>
    </div>
  );
}
