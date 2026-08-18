export function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatDate(dateStr: Date | string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeErrorMessage(status: number, data?: any): string {
  if (status === 401) return "You must be logged in.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 404) return "The requested record was not found.";
  if (status === 400) {
    if (data?.error === 'STALE_OR_INVALID_STATE') return "The record was modified by another user. Please refresh and try again.";
    if (data?.error === 'DUPLICATE_IDEMPOTENCY_KEY') return "This action has already been processed.";
    return "Invalid input provided. Please check your data.";
  }
  return "An unexpected error occurred. Please try again.";
}
