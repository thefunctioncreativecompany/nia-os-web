// Invite codes for parts of Nia that aren't open to everyone yet, entered on their coming-soon
// screens. The database checks the code (20261101000000_explore_access.sql,
// 20261102000000_marketplace_access.sql) and slows down guessing.
import type { SupabaseClient } from "@supabase/supabase-js";

export type CodeArea = "explore" | "marketplace";
export type CodeResult = "unlocked" | "wrong" | { error: string };

const REDEEM: Record<CodeArea, string> = {
  explore: "redeem_explore_code",
  marketplace: "redeem_marketplace_code",
};

/** Enter an invite code. */
export async function redeemCode(db: SupabaseClient, area: CodeArea, code: string): Promise<CodeResult> {
  const { data, error } = await db.rpc(REDEEM[area], { code });
  if (error) return { error: error.code === "P0001" ? error.message : "That didn't work. Try again in a moment." };
  return data === true ? "unlocked" : "wrong";
}
