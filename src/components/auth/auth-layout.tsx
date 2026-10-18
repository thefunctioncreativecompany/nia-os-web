import { dmSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { heroSlides } from "@/components/auth/hero-slides";
import { HeroSlideshow } from "@/components/auth/hero-slideshow";

// Shared shell for every auth and onboarding screen: rotating hero images on the
// left, form panel on the right, brand footer underneath.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        dmSans.className,
        "flex min-h-svh w-full flex-col bg-white [font-variation-settings:'opsz'_14]",
      )}
    >
      <div className="flex flex-1">
        <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden p-12 md:flex">
          <p className="relative z-40 font-[ui-rounded,'SF_Pro_Rounded',system-ui,sans-serif] text-[22px] font-bold text-white">
            NIA
          </p>
          <HeroSlideshow slides={heroSlides} />
        </aside>
        <main className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-12">
          {children}
        </main>
      </div>
      <footer className="bg-nia-footer px-4 py-5">
        <p className="text-center text-[13px] leading-normal text-white/50">
          NIA is an AI-enabled content production operating system.
        </p>
      </footer>
    </div>
  );
}
