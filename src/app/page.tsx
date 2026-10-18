import { redirect } from "next/navigation";

// The proxy normally sends visitors on before this runs (signed out → login,
// signed in → the app). This covers the case where it can't.
export default function Page() {
  redirect("/login");
}
