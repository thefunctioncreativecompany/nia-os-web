import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/nia/wordmark";

// "Not found" (audit #4): a link that's wrong, a project or document that was deleted or isn't
// shared with you, or a share link that was turned off. Says so plainly and offers a way back.
export function NotFoundView({ signedIn = true }: { signedIn?: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-20 text-center">
      {!signedIn && <Wordmark className="mb-4 h-6 w-auto" />}
      <span className="flex size-14 items-center justify-center rounded-full bg-nia-panel">
        <Compass aria-hidden className="size-6 text-muted-foreground" />
      </span>
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-h2 font-bold text-foreground">We couldn&rsquo;t find that</h1>
        <p className="text-lead text-muted-foreground">
          The link may be wrong, or what it pointed to was deleted, moved, or isn&rsquo;t shared with you.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {signedIn ? (
          <>
            <Button asChild>
              <Link href="/home">Go to Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/projects">Your projects</Link>
            </Button>
          </>
        ) : (
          // The bare address takes signed-in people home and everyone else to Log in.
          <Button asChild>
            <Link href="/">Go to Nia</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
