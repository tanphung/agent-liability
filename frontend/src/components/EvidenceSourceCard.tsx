import { ExternalLink } from "lucide-react";

export function EvidenceSourceCard({ label, url }: { label: string; url: string }) {
  return (
    <a className="evidence-card" href={url} target="_blank" rel="noreferrer">
      <span>{label}</span>
      <strong>{url}</strong>
      <ExternalLink size={16} />
    </a>
  );
}
