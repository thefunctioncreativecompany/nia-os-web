import Image from "next/image";
import Link from "next/link";

import { nextStepHref } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { authButtonClassName } from "@/components/auth/auth-primitives";
import { OnboardingStep, SkipLink } from "@/components/onboarding/onboarding-primitives";

const PLATFORMS = [
  {
    name: "IMDb",
    description: "Import credits, filmography & bio",
    logo: "/onboarding/imdb.svg",
    width: 63,
  },
  {
    name: "LinkedIn",
    description: "Import work history & connections",
    logo: "/onboarding/linkedin.svg",
    width: 32,
  },
  {
    name: "Vimeo",
    description: "Import portfolio & showreel",
    logo: "/onboarding/vimeo.svg",
    width: 32,
  },
];

// Importing isn't built yet: the platforms show as "Coming soon" and both actions move on.
export function ImportStep() {
  const next = nextStepHref("import");

  return (
    <OnboardingStep
      step="import"
      title="Import your profile"
      description="Speed up your setup by importing credits and bio from an existing platform"
    >
      <ul className="flex flex-col gap-3">
        {PLATFORMS.map((platform) => (
          <li
            key={platform.name}
            className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-border bg-white p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src={platform.logo}
                alt=""
                width={platform.width}
                height={32}
                className="shrink-0 rounded-sm"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm leading-[1.4] font-bold text-foreground">{platform.name}</p>
                <p className="text-[13px] leading-normal text-muted-foreground">
                  {platform.description}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-[13px] leading-normal font-bold text-muted-foreground">
              Coming soon
            </span>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs leading-normal text-muted-foreground">
        Your data is encrypted and only used to populate your NIA profile
      </p>

      <div className="flex flex-col items-center gap-5">
        <SkipLink href={next}>Skip for now</SkipLink>
        <Button asChild className={authButtonClassName}>
          <Link href={next}>Continue</Link>
        </Button>
      </div>
    </OnboardingStep>
  );
}
