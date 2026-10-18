// Profile photos live in the public "avatars" bucket, under each user's own folder.
export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB, per the design

// Storage path of a photo URL, if it's one this user uploaded (so it can be removed).
export function avatarPath(url: string | null, userId: string) {
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  const path = url?.split(marker)[1];
  return path?.startsWith(`${userId}/`) ? decodeURIComponent(path) : null;
}

export function initials(name: string, fallback = "") {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("");
  return (letters.length > 1 ? letters[0] + letters[letters.length - 1] : letters || fallback[0] || "")
    .toUpperCase();
}
