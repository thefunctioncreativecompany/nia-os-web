// What to call someone in a greeting (FEEDBACK B9: "Welcome, bukenya" used the surname). In order:
// the name they chose in Settings → Profile ("What should we call you?"), the first name their
// Google account gave, then the first word of their full name. A name typed all in lower case
// gets its capital.
export function firstNameOf({ preferred, given, full }: { preferred?: string | null; given?: string | null; full?: string | null }): string {
  const pick = preferred?.trim() || given?.trim() || full?.trim().split(/\s+/)[0] || "";
  return pick && pick === pick.toLowerCase() ? pick[0].toUpperCase() + pick.slice(1) : pick;
}
