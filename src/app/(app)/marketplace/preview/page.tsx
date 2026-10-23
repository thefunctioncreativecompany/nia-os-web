import { redirect } from "next/navigation";

// The store used to live here before Marketplace had invite codes; old links go to /marketplace.
export default function Page() {
  redirect("/marketplace");
}
