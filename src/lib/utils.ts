export { cn } from "cn"

// "Jane Doe" -> "JD", shown when a user has no avatar picture.
export function getInitials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}
