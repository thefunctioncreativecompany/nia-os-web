import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

/** What `feature_waitlist.feature` accepts (its check constraint). */
export type WaitlistFeature = "explore" | "marketplace" | "marketplace-lister";

// "Notify me" on coming-soon screens: whether this person is on a feature's waitlist, and a
// toggle that saves it (feature_waitlist, own rows only). `waiting` is null while it loads.
export function useWaitlist(feature: WaitlistFeature, messages: { joined: string; left: string }) {
  const [waiting, setWaiting] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    createClient()
      .from("feature_waitlist")
      .select("feature")
      .eq("feature", feature)
      .then(({ data, error }) => live && setWaiting(error ? false : (data ?? []).length > 0));
    return () => {
      live = false;
    };
  }, [feature]);

  const toggle = async () => {
    const supabase = createClient();
    const next = !waiting;
    setWaiting(next);
    const { error } = next
      ? await supabase.from("feature_waitlist").insert({ feature })
      : await supabase.from("feature_waitlist").delete().eq("feature", feature);
    // 23505: already on the list (another tab got there first), which is what was asked for.
    if (error && error.code !== "23505") {
      setWaiting(!next);
      toast.error("Couldn't save that. Try again.");
      return;
    }
    toast.success(next ? messages.joined : messages.left);
  };

  return { waiting, toggle };
}
