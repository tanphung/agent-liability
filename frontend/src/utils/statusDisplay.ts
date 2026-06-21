export function getStatusLabel(status: string): string {
  if (status === "DRAFT") {
    return "SETUP";
  }
  return status;
}
