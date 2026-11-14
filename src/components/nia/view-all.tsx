import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

// "View all" and every "go to the rest" link (Ika, 2026-11-11: one look across the platform, from
// Explore's): a grey pill with an arrow beside a section's heading (Ika, 2026-11-14: one blue button per
// screen, for its main action; View all is never it). A link by default; with
// `onClick` it's a button (a list that opens in a dialog). No counts in the label.
export function ViewAll({
  href,
  onClick,
  disabled,
  children = "View all",
  className,
}: {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const body = (
    <>
      {children}
      <ArrowRight aria-hidden data-icon="inline-end" />
    </>
  );
  if (href)
    return (
      <Button variant="secondary" asChild className={className}>
        <Link href={href}>{body}</Link>
      </Button>
    );
  return (
    <Button variant="secondary" onClick={onClick} disabled={disabled} className={className}>
      {body}
    </Button>
  );
}
