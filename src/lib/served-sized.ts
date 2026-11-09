// Pictures Nia already serves at a sensible size (Explore's trailer stills, cut by its own route,
// src/app/api/explore-still): shown as they are rather than through Vercel's image resizer, whose
// monthly allowance on the current plan ran out on 2026-11-08 (new pictures came back as "402").
// Pass to next/image as `unoptimized={servedSized(src)}`.
export const servedSized = (src: string | null | undefined) => !!src && src.startsWith("/api/explore-still/");
