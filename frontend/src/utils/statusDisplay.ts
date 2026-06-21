export function getStatusLabel(status: string): string {
  if (status === "DRAFT") {
    return "CREATED";
  }
  return status;
}
