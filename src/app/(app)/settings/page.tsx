import { redirect } from "next/navigation";

// Profile is the first settings tab built; General takes over once it exists.
export default function Page() {
  redirect("/settings/profile");
}
