import { redirect } from "next/navigation";

// General is the first settings tab.
export default function Page() {
  redirect("/settings/general");
}
