import Link from "next/link";
import { ClapperboardIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <ClapperboardIcon className="size-6" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Nia OS</h1>
        <p className="text-muted-foreground">
          The operating system for creative production.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/dashboard">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/sign-up">Create account</Link>
        </Button>
      </div>
    </main>
  );
}
