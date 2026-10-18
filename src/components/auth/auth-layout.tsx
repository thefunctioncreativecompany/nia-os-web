import Image from "next/image";

import { HERO_IMAGES, type HeroImage, type HeroScreen } from "@/components/auth/hero-images";

// Shared shell for every auth and onboarding screen: the screen's hero photo on the
// left, form panel on the right, brand footer underneath.
export function AuthLayout({ hero, children }: { hero: HeroScreen; children: React.ReactNode }) {
  const image: HeroImage = HERO_IMAGES[hero];

  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      <div className="flex flex-1">
        <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-nia-footer p-12 md:flex">
          <Image
            src={image.src}
            alt=""
            fill
            preload
            quality={90}
            sizes="(min-width: 768px) 50vw, 1px"
            placeholder="blur"
            style={{ objectPosition: image.position ?? "50% 50%" }}
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-black/15" />
          <p className="relative font-wordmark text-wordmark font-bold text-white">NIA</p>
          {image.caption ? (
            <p className="relative text-sm leading-normal text-white opacity-90">{image.caption}</p>
          ) : (
            <span />
          )}
        </aside>
        <main className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
          {children}
        </main>
      </div>
      <footer className="bg-nia-footer px-4 py-5">
        <p className="text-center text-small text-white/50">
          NIA is an AI-enabled content production operating system.
        </p>
      </footer>
    </div>
  );
}
