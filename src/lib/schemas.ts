import { z } from "zod";

// What server actions accept (security audit, 2026-11-15). A server action is a public address:
// anyone can call it with anything, not only the values our own pages send. Each action checks
// its input against one of these first and answers as for "not found" when it doesn't fit, so odd
// input is turned away instead of crashing the action or reaching a lookup.

/** An Explore title, film or creator film: "atlantics", "creator-DDzBw_xKbKm". */
export const exploreSlug = z.string().min(1).max(120).regex(/^[A-Za-z0-9_-]+$/);

/** A template's code: "D07", "G12", "T01". */
export const templateCode = z.string().regex(/^[A-Z]\d{2}$/);

/** A row's id in the database. */
export const rowId = z.uuid();

/** An email address someone typed (any case, spaces around it allowed). */
export const emailAddress = z.string().trim().max(320).pipe(z.email());

/** A link someone pasted. Read further by the action (parseInstagramLink and the like). */
export const pastedLink = z.string().max(2000);
