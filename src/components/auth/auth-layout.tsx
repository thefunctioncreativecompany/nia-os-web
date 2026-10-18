import Image from "next/image";

import { dmSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/auth-hero.jpg";

// Hero image framing from Figma, as the image box relative to the hero panel.
// The box plus object-cover matches the design at 1440px and never distorts.
const heroCrops = {
  // Login and sign-up
  default: { top: "-12.61%", left: "-77.39%", width: "254.69%", height: "131.61%" },
  // Forgot password, reset password and check email
  recovery: { top: "-16.77%", left: "-71.31%", width: "258.2%", height: "133.42%" },
};

// Shared shell for every auth screen: hero image on the left,
// form panel on the right, brand footer underneath.
export function AuthLayout({
  children,
  caption,
  crop = "default",
}: {
  children: React.ReactNode;
  caption: string;
  crop?: keyof typeof heroCrops;
}) {
  return (
    <div
      className={cn(
        dmSans.className,
        "flex min-h-svh w-full flex-col bg-white [font-variation-settings:'opsz'_14]",
      )}
    >
      <div className="flex flex-1">
        <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden p-12 md:flex">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute" style={heroCrops[crop]}>
              <Image
                src={heroImage}
                alt=""
                fill
                preload
                sizes="(min-width: 768px) 130vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/15" />
          </div>
          <p className="relative font-[ui-rounded,'SF_Pro_Rounded',system-ui,sans-serif] text-[22px] font-bold text-white">
            NIA
          </p>
          <p className="relative text-sm leading-normal text-white opacity-90">
            {caption}
          </p>
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
